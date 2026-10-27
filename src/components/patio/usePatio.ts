"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPatio } from "@/lib/api/services/patio";
import { PATIO_QUERY_KEY } from "./patioKeys";

export const PATIO_ATUALIZACAO_MS = 5 * 60_000;

export interface UsePatioOptions {
  // Com um modal aberto (a saída), a lista não muda debaixo do operador.
  pausado?: boolean;
}

// A permanência vem pronta do servidor no instante da consulta: a atualização a cada 5 minutos a mantém em dia, e as
// entradas e saídas de outros terminais aparecem sem o operador pedir. Não atualiza com a aba escondida.
export function usePatio({ pausado = false }: UsePatioOptions = {}) {
  return useQuery({
    queryKey: PATIO_QUERY_KEY,
    queryFn: listPatio,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchInterval: pausado ? false : PATIO_ATUALIZACAO_MS,
    refetchIntervalInBackground: false,
  });
}
