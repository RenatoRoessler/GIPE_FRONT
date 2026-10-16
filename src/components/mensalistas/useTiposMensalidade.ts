"use client";

import { useQuery } from "@tanstack/react-query";
import { listTiposMensalidade } from "@/lib/api/services/mensalista";

export const TIPOS_QUERY_KEY = ["mensalistas-tipos"] as const;
export const MENSALISTAS_QUERY_KEY = ["mensalistas"] as const;

// Lista completa (ativos e inativos); o back não pagina. A mesma consulta alimenta a aba de tipos e o
// seletor do cadastro de mensalista.
export function useTiposMensalidade() {
  return useQuery({
    queryKey: TIPOS_QUERY_KEY,
    queryFn: listTiposMensalidade,
    refetchOnWindowFocus: false,
  });
}
