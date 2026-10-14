"use client";

import { useQuery } from "@tanstack/react-query";
import { getCaixa, getSaldo, getTurnoAtual } from "@/lib/api/services/caixa";
import { isCaixaAberto } from "./format";

export const CAIXA_KEY = ["caixa"] as const;

// Saldo e turno só são consultados com o caixa aberto; mudam por ação de outros operadores,
// então recarregam ao voltar o foco para a janela.
export function useCaixa() {
  const caixaQuery = useQuery({ queryKey: CAIXA_KEY, queryFn: getCaixa, refetchOnWindowFocus: false });
  const caixa = caixaQuery.data && isCaixaAberto(caixaQuery.data) ? caixaQuery.data : null;

  const saldoQuery = useQuery({
    queryKey: [...CAIXA_KEY, "saldo"],
    queryFn: getSaldo,
    enabled: caixa !== null,
  });
  const turnoQuery = useQuery({
    queryKey: [...CAIXA_KEY, "turno"],
    queryFn: getTurnoAtual,
    enabled: caixa !== null,
  });

  return { caixaQuery, caixa, saldoQuery, turnoQuery };
}
