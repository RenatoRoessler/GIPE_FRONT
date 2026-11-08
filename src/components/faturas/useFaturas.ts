"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listFaturas } from "@/lib/api/services/fatura";
import type { FaturaFiltros } from "@/types/fatura";
import { faturasKey } from "./queryKeys";

export function useFaturas(filtros: FaturaFiltros) {
  return useQuery({
    queryKey: faturasKey(filtros),
    queryFn: () => listFaturas(filtros),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
