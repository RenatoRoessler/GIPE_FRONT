"use client";

import { useQuery } from "@tanstack/react-query";
import { listQuadros } from "@/lib/api/services/quadroChaves";
import { QUADROS_QUERY_KEY } from "./quadrosKeys";

export const QUADROS_STALE_MS = 15_000;

// A disponibilidade muda a cada entrada e saída, em qualquer terminal: a consulta é curta e refaz no foco da aba.
export function useQuadros() {
  return useQuery({
    queryKey: QUADROS_QUERY_KEY,
    queryFn: listQuadros,
    staleTime: QUADROS_STALE_MS,
    refetchOnWindowFocus: true,
  });
}
