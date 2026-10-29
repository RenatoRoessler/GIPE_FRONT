"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listConveniadas } from "@/lib/api/services/conveniada";
import type { SituacaoFiltro } from "@/types/conveniada";
import { conveniadasKey } from "./conveniadasKeys";

export function useConveniadas(situacao: SituacaoFiltro) {
  return useQuery({
    queryKey: conveniadasKey(situacao),
    queryFn: () => listConveniadas(situacao),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
