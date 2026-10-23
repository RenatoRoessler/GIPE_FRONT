"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listHistoricoCaixas } from "@/lib/api/services/caixa";
import { CAIXA_KEY } from "./useCaixa";

export type HistoricoFiltro = {
  // yyyy-MM-dd, vazio = sem limite.
  dataInicio: string;
  dataFim: string;
  pagina: number;
};

export const HISTORICO_PAGE_SIZE = 20;

// Caixas fechados, paginados pelo servidor. Entre páginas mantém a anterior na tela para a tabela não piscar.
export function useHistoricoCaixas({ dataInicio, dataFim, pagina }: HistoricoFiltro) {
  return useQuery({
    queryKey: [...CAIXA_KEY, "historico", { dataInicio, dataFim, pagina }],
    queryFn: () => listHistoricoCaixas({ dataInicio, dataFim, pagina, tamanhoPagina: HISTORICO_PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
