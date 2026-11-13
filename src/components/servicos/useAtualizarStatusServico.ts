"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { atualizarStatusServico } from "@/lib/api/services/servico";
import type { ItemFila, ServicosDoVeiculo, StatusServico } from "@/types/servico";
import { FILA_SERVICOS_KEY, SERVICOS_DO_VEICULO_KEY } from "./servicosKeys";

export interface TrocaDeStatus {
  idPatio: number;
  patioServicoId: number;
  destino: StatusServico;
}

type SnapshotDaFila = [readonly unknown[], ItemFila[] | undefined][];
type SnapshotDoVeiculo = [readonly unknown[], ServicosDoVeiculo | undefined][];

// Só os serviços do veículo da troca: as consultas dele (com e sem cancelados) começam por esta chave.
const chaveDoVeiculo = (idPatio: number) => [...SERVICOS_DO_VEICULO_KEY, idPatio] as const;

function aplicarNoVeiculo(queryClient: QueryClient, { idPatio, patioServicoId, destino }: TrocaDeStatus) {
  for (const [chave, dados] of queryClient.getQueriesData<ServicosDoVeiculo>({ queryKey: chaveDoVeiculo(idPatio) })) {
    if (!dados) continue;
    queryClient.setQueryData(chave, {
      ...dados,
      servicos: dados.servicos.map((servico) => (servico.id === patioServicoId ? { ...servico, status: destino } : servico)),
    });
  }
}

// O filtro de status é o último pedaço da chave da fila: "todos" ou o número do status.
function filtroDaChave(chave: readonly unknown[]): unknown {
  return chave[chave.length - 1];
}

function aplicarNaFila(queryClient: QueryClient, { patioServicoId, destino }: TrocaDeStatus) {
  for (const [chave, itens] of queryClient.getQueriesData<ItemFila[]>({ queryKey: FILA_SERVICOS_KEY })) {
    if (!itens) continue;
    const filtro = filtroDaChave(chave);
    const proximos = itens.flatMap((item) => {
      if (item.patioServicoId !== patioServicoId) return [item];
      // Uma fila filtrada por outro status deixa de ter o cartão.
      if (filtro !== "todos" && filtro !== destino) return [];
      return [{ ...item, status: destino }];
    });
    queryClient.setQueryData(chave, proximos);
  }
}

// Trocar o status é a ação mais frequente do lavador e dá para corrigir: o cartão muda de coluna na hora e, se o back
// recusar, volta para onde estava. O mesmo vale para a lista de serviços do veículo, que o ticket mostra. Depois, a fila
// e os serviços do veículo (e o valor da saída) são lidos de novo.
export function useAtualizarStatusServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idPatio, patioServicoId, destino }: TrocaDeStatus) => atualizarStatusServico(idPatio, patioServicoId, destino),
    onMutate: async (troca): Promise<{ anteriores: SnapshotDaFila; doVeiculo: SnapshotDoVeiculo }> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: FILA_SERVICOS_KEY }),
        queryClient.cancelQueries({ queryKey: chaveDoVeiculo(troca.idPatio) }),
      ]);
      const anteriores = queryClient.getQueriesData<ItemFila[]>({ queryKey: FILA_SERVICOS_KEY });
      const doVeiculo = queryClient.getQueriesData<ServicosDoVeiculo>({ queryKey: chaveDoVeiculo(troca.idPatio) });
      aplicarNaFila(queryClient, troca);
      aplicarNoVeiculo(queryClient, troca);
      return { anteriores, doVeiculo };
    },
    onError: (_erro, _troca, contexto) => {
      for (const [chave, itens] of contexto?.anteriores ?? []) {
        queryClient.setQueryData(chave, itens);
      }
      for (const [chave, dados] of contexto?.doVeiculo ?? []) {
        queryClient.setQueryData(chave, dados);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FILA_SERVICOS_KEY });
      void queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY });
    },
  });
}
