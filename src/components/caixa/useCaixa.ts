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

export interface UseCaixaAbertoOptions {
  // Sem permissão para o caixa (ou sem necessidade do dado) a consulta nem sai.
  enabled?: boolean;
}

// Só a situação do caixa (aberto ou fechado), para quem apenas mostra o estado: não busca turno nem movimentos.
// Usa a mesma consulta e a mesma chave do `useCaixa`, então o cache é compartilhado com a tela do caixa.
export function useCaixaAberto({ enabled = true }: UseCaixaAbertoOptions = {}) {
  const query = useQuery({ queryKey: CAIXA_KEY, queryFn: getCaixa, refetchOnWindowFocus: false, enabled });
  const carregando = enabled && query.isPending;
  const aberto = query.data ? isCaixaAberto(query.data) : false;
  return { aberto, carregando, erro: query.isError };
}
