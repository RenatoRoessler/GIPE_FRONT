"use client";

import { useQuery } from "@tanstack/react-query";
import { getCaixa, getTurnoAtual, listMovimentos } from "@/lib/api/services/caixa";
import { isCaixaAberto } from "./format";

export const CAIXA_KEY = ["caixa"] as const;

// O saldo vem do próprio GET /Caixa. O turno só é consultado com o caixa aberto; muda por ação de
// outros operadores, então recarrega ao voltar o foco para a janela.
export function useCaixa() {
  const caixaQuery = useQuery({ queryKey: CAIXA_KEY, queryFn: getCaixa, refetchOnWindowFocus: false });
  const caixa = caixaQuery.data && isCaixaAberto(caixaQuery.data) ? caixaQuery.data : null;

  const turnoQuery = useQuery({
    queryKey: [...CAIXA_KEY, "turno"],
    queryFn: getTurnoAtual,
    enabled: caixa !== null,
  });

  // Os movimentos mudam por ação de qualquer operador: recarregam ao voltar o foco, sem polling.
  const movimentosQuery = useQuery({
    queryKey: [...CAIXA_KEY, "movimentos"],
    queryFn: listMovimentos,
    enabled: caixa !== null,
    refetchOnWindowFocus: true,
  });

  return { caixaQuery, caixa, turnoQuery, movimentosQuery };
}
