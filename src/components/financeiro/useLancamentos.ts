"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listLancamentos } from "@/lib/api/services/financeiro";
import type { LancamentoFiltros } from "@/types/financeiro";
import { lancamentosKey } from "./queryKeys";

export function useLancamentos(filtros: LancamentoFiltros) {
  return useQuery({
    queryKey: lancamentosKey(filtros),
    queryFn: () => listLancamentos(filtros),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
