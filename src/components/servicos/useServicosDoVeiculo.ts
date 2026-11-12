"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useConfiguracao } from "@/components/configuracoes/useConfiguracao";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { ApiError } from "@/lib/api/errors";
import { acrescentarServicos, cancelarServico, listServicosDoVeiculo } from "@/lib/api/services/servico";
import { FILA_SERVICOS_KEY, servicosDoVeiculoKey } from "./servicosKeys";

// Limite do motivo no back.
export const MOTIVO_MAXIMO = 200;

// Acrescentar e cancelar mudam o valor e o tempo permitido do veículo, que a saída lê do pátio; a fila também muda.
function atualizarAposMudanca(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: FILA_SERVICOS_KEY });
}

// Serviços do veículo no pátio, com o valor, o tempo permitido e até quando a permanência é livre.
export function useServicosDoVeiculo(idPatio: number, incluirCancelados: boolean, enabled = true) {
  return useQuery({
    queryKey: servicosDoVeiculoKey(idPatio, incluirCancelados),
    queryFn: () => listServicosDoVeiculo(idPatio, { incluirCancelados }),
    enabled,
    staleTime: 0,
  });
}

export function useAcrescentarServicos(idPatio: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (servicoIds: number[]) => acrescentarServicos(idPatio, servicoIds),
    onSuccess: () => atualizarAposMudanca(queryClient),
  });
}

// O motivo é obrigatório e a regra fica aqui também, para nenhuma tela mandar um cancelamento sem ele.
export function useCancelarServico(idPatio: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patioServicoId, motivo }: { patioServicoId: number; motivo: string }) => {
      const texto = motivo.trim();
      if (texto === "") {
        return Promise.reject(new ApiError("validation", "Informe o motivo do cancelamento."));
      }
      if (texto.length > MOTIVO_MAXIMO) {
        return Promise.reject(new ApiError("validation", `O motivo pode ter no máximo ${MOTIVO_MAXIMO} caracteres.`));
      }
      return cancelarServico(idPatio, patioServicoId, texto);
    },
    onSuccess: () => atualizarAposMudanca(queryClient),
  });
}

// Serviços ligados na configuração da empresa. Falso enquanto a configuração carrega ou se falhar: acrescentar serviço
// só aparece quando o back confirmou que está ligado, em vez de aparecer e sumir.
export function useServicosHabilitados(): boolean {
  const { configuracao, carregada } = useConfiguracao();
  return carregada && configuracao.servicos;
}
