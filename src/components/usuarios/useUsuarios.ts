"use client";

import { useQuery } from "@tanstack/react-query";
import { listUsuarios } from "@/lib/api/services/usuario";

export const USUARIOS_QUERY_KEY = ["usuarios"] as const;

// Lista completa (ativos e inativos); o back não pagina.
export function useUsuarios({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: USUARIOS_QUERY_KEY,
    queryFn: listUsuarios,
    refetchOnWindowFocus: false,
  });
}
