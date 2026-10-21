"use client";

import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getContratoMensalista } from "@/lib/api/services/mensalista";
import type { ContratoMensalista, Mensalista } from "@/types/mensalista";
import { precisaDoContrato } from "./situacao";
import { MENSALISTAS_QUERY_KEY } from "./useTiposMensalidade";

const CONTRATO_STALE_MS = 60_000;

// Prefixado por MENSALISTAS_QUERY_KEY: invalidar a lista também atualiza os contratos.
export const contratoQueryKey = (mensalistaId: number) => [...MENSALISTAS_QUERY_KEY, "contrato", mensalistaId] as const;

function contratoQueryOptions(mensalistaId: number) {
  return {
    queryKey: contratoQueryKey(mensalistaId),
    queryFn: () => getContratoMensalista(mensalistaId),
    staleTime: CONTRATO_STALE_MS,
    retry: false,
    refetchOnWindowFocus: false,
  };
}

export type ContratosPorMensalista = Map<number, UseQueryResult<ContratoMensalista | null>>;

// Consulta o contrato só das linhas que dependem dele (inativos aguardando o 1º pagamento): no máximo uma página.
export function useContratosMensalistas(items: Mensalista[]): ContratosPorMensalista {
  const alvos = items.filter(precisaDoContrato);
  const results = useQueries({ queries: alvos.map((mensalista) => contratoQueryOptions(mensalista.mensalistaId)) });
  return new Map(alvos.map((mensalista, index) => [mensalista.mensalistaId, results[index]]));
}

// Consulta de um só contrato (ex.: ficha de um mensalista que a linha não precisou consultar).
export function useContratoMensalista(mensalistaId: number, enabled = true) {
  return useQuery({ ...contratoQueryOptions(mensalistaId), enabled });
}
