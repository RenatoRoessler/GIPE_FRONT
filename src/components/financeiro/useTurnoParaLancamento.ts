"use client";

import { useQuery } from "@tanstack/react-query";
import { CAIXA_KEY } from "@/components/caixa/useCaixa";
import { isForbiddenError } from "@/lib/api/errors";
import { getTurnoAtual } from "@/lib/api/services/caixa";

// O turno em andamento, para saber se o lançamento pode sair pela gaveta e quanto há nela. Usa a mesma chave do Caixa,
// então o cache é compartilhado. `semPermissao` (403): o perfil não consulta o turno, e a conferência fica com o back.
export function useTurnoParaLancamento(enabled: boolean) {
  const query = useQuery({
    enabled,
    queryKey: [...CAIXA_KEY, "turno"],
    queryFn: getTurnoAtual,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    turno: query.data,
    carregando: enabled && query.isPending,
    semPermissao: query.isError && isForbiddenError(query.error),
  };
}
