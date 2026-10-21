"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAllMensalistas } from "@/lib/api/services/mensalista";
import { MENSALISTAS_QUERY_KEY } from "./useTiposMensalidade";

export const AGENDA_QUERY_KEY = [...MENSALISTAS_QUERY_KEY, "agenda"] as const;

// Está sob o prefixo dos mensalistas: pagar, reenviar o contrato ou cadastrar já atualiza a agenda.
export function useAgendaMensalistas({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: AGENDA_QUERY_KEY,
    queryFn: () => listAllMensalistas(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
