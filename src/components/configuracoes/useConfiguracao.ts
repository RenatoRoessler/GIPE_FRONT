"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfiguracao, updateConfiguracao } from "@/lib/api/services/configuracao";
import { CONFIGURACAO_PADRAO, type Configuracao, type ConfiguracaoValues } from "@/types/configuracao";

export const CONFIGURACAO_QUERY_KEY = ["configuracao"] as const;

const SEM_ALTERACAO: Configuracao = { ...CONFIGURACAO_PADRAO, alteradoPorId: null, alteradoEm: null };

// Único ponto de leitura da configuração: a tela e os formulários de entrada. Enquanto carrega, ou se falhar, vale o
// padrão da empresa, para o operador nunca ficar travado (o back continua sendo quem valida).
export function useConfiguracao() {
  const query = useQuery({
    queryKey: CONFIGURACAO_QUERY_KEY,
    queryFn: getConfiguracao,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    configuracao: query.data ?? SEM_ALTERACAO,
    // Dados reais do servidor; falso enquanto vale o padrão.
    carregada: query.data !== undefined,
    carregando: query.isPending,
    erro: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

// O cache só muda com o que o back confirmou, para a linha de auditoria mostrar quem e quando de verdade.
export function useSalvarConfiguracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ConfiguracaoValues) => updateConfiguracao(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIGURACAO_QUERY_KEY }),
  });
}
