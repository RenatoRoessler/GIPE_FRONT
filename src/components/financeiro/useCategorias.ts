"use client";

import { useQuery } from "@tanstack/react-query";
import { listCategorias } from "@/lib/api/services/financeiro";
import { CATEGORIAS_KEY } from "./queryKeys";

// Todas as categorias (ativas e inativas) numa consulta só. A aba, os selects e os filtros usam a mesma lista e filtram na tela.
export function useCategorias() {
  return useQuery({
    queryKey: CATEGORIAS_KEY,
    queryFn: listCategorias,
    refetchOnWindowFocus: false,
  });
}
