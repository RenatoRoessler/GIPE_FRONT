"use client";

import { useQuery } from "@tanstack/react-query";
import { obterAberta } from "@/lib/api/services/conferenciaPatio";
import { conferenciaAbertaKey } from "./conferenciaKeys";

export const CONFERENCIA_ATUALIZACAO_MS = 30_000;

export interface UseConferenciaAbertaOptions {
  // Atualização periódica: o trabalho de outros operadores na mesma conferência aparece sem o operador pedir.
  ativo?: boolean;
}

// A conferência em andamento da empresa (`null` quando não há). É a fonte única da tela: as ações atualizam este cache
// com a resposta do servidor. Não atualiza com a aba escondida.
export function useConferenciaAberta({ ativo = false }: UseConferenciaAbertaOptions = {}) {
  return useQuery({
    queryKey: conferenciaAbertaKey,
    queryFn: obterAberta,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: ativo ? CONFERENCIA_ATUALIZACAO_MS : false,
    refetchIntervalInBackground: false,
  });
}
