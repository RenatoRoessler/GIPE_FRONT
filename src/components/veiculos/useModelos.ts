"use client";

import { useQuery } from "@tanstack/react-query";
import { prepararModelos } from "@/lib/buscaModelo";
import { listModelos } from "@/lib/api/services/veiculo";

// A lista inteira de modelos é buscada uma vez e fica no cache durante a sessão; todos os campos a compartilham.
export function useModelos() {
  return useQuery({
    queryKey: ["veiculo", "modelos"],
    queryFn: ({ signal }) => listModelos(signal),
    select: prepararModelos,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
