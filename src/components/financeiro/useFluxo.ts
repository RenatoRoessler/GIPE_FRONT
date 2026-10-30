"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getFluxo } from "@/lib/api/services/financeiro";
import type { FluxoParams } from "@/types/financeiro";
import { fluxoKey } from "./queryKeys";

// `enabled` fica falso enquanto o período digitado não é válido: nada é buscado com datas erradas.
export function useFluxo(params: FluxoParams, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: fluxoKey(params),
    queryFn: () => getFluxo(params),
    // Trocar de período ou de agrupamento mantém o fluxo anterior na tela até o novo chegar.
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
