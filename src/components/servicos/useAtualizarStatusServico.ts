"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { atualizarStatusServico } from "@/lib/api/services/servico";
import { STATUS_SERVICO, type ItemFila, type ServicoDoVeiculo, type ServicosDoVeiculo, type StatusServico } from "@/types/servico";
import { instanteLocal } from "./fila";
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

// As datas que o back grava na troca: Em execução marca o início (se ainda não havia) e Pronto marca o pronto. Voltar um
// passo não mexe nas datas aqui: o que o back faz com elas não está documentado, e a leitura seguinte traz a resposta dele.
function datasDaFila(item: ItemFila, destino: StatusServico, agora: string): Pick<ItemFila, "iniciadoEm" | "prontoEm"> {
  if (destino === STATUS_SERVICO.EmExecucao) {
    // Iniciar (a partir da fila) começa de novo, mesmo que o serviço já tenha sido iniciado e devolvido; quem volta de Pronto
    // para Em andamento já tinha começado, e o início continua o mesmo.
    return { iniciadoEm: item.status === STATUS_SERVICO.Aguardando ? agora : (item.iniciadoEm ?? agora), prontoEm: null };
  }
  if (destino === STATUS_SERVICO.Pronto) {
    return { iniciadoEm: item.iniciadoEm ?? agora, prontoEm: agora };
  }
  return { iniciadoEm: item.iniciadoEm ?? null, prontoEm: item.prontoEm ?? null };
}

function datasDoVeiculo(servico: ServicoDoVeiculo, destino: StatusServico, agora: string): Pick<ServicoDoVeiculo, "prontoEm"> {
  if (destino === STATUS_SERVICO.Pronto) return { prontoEm: agora };
  if (destino === STATUS_SERVICO.EmExecucao) return { prontoEm: null };
  return { prontoEm: servico.prontoEm };
}

function aplicarNoVeiculo(queryClient: QueryClient, { idPatio, patioServicoId, destino }: TrocaDeStatus) {
  const agora = instanteLocal();
  for (const [chave, dados] of queryClient.getQueriesData<ServicosDoVeiculo>({ queryKey: chaveDoVeiculo(idPatio) })) {
    if (!dados) continue;
    queryClient.setQueryData(chave, {
      ...dados,
      servicos: dados.servicos.map((servico) => (servico.id === patioServicoId ? { ...servico, status: destino, ...datasDoVeiculo(servico, destino, agora) } : servico)),
    });
  }
}

// O filtro de status é o último pedaço da chave da fila: "todos" ou o número do status.
function filtroDaChave(chave: readonly unknown[]): unknown {
  return chave[chave.length - 1];
}

function aplicarNaFila(queryClient: QueryClient, { patioServicoId, destino }: TrocaDeStatus) {
  const agora = instanteLocal();
  for (const [chave, itens] of queryClient.getQueriesData<ItemFila[]>({ queryKey: FILA_SERVICOS_KEY })) {
    if (!itens) continue;
    const filtro = filtroDaChave(chave);
    const proximos = itens.flatMap((item) => {
      if (item.patioServicoId !== patioServicoId) return [item];
      // Uma fila filtrada por outro status deixa de ter o cartão.
      if (filtro !== "todos" && filtro !== destino) return [];
      return [{ ...item, status: destino, ...datasDaFila(item, destino, agora) }];
    });
    queryClient.setQueryData(chave, proximos);
  }
}

// Trocar o status é a ação mais frequente do lavador e dá para corrigir: o cartão muda de coluna na hora, já com a hora de
// início ou de pronto (o tempo e a barra de progresso aparecem sem esperar a releitura) e, se o back recusar, volta para
// onde estava. O mesmo vale para a lista de serviços do veículo, que o ticket mostra. Depois, a fila
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
