"use client";

import { useQuery } from "@tanstack/react-query";
import { listMovimentosCaixa } from "@/lib/api/services/caixa";
import { CAIXA_KEY } from "./useCaixa";

// Extrato de um caixa já fechado; não muda mais, então não refaz ao voltar o foco.
export function useMovimentosCaixa(caixaId: number) {
  return useQuery({
    queryKey: [...CAIXA_KEY, "historico", caixaId, "movimentos"],
    queryFn: () => listMovimentosCaixa(caixaId),
    enabled: Number.isFinite(caixaId) && caixaId > 0,
    refetchOnWindowFocus: false,
  });
}
