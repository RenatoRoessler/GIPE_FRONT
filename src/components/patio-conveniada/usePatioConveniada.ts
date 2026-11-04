"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listarPatioConveniada } from "@/lib/api/services/patioConveniada";
import { patioConveniadaKey } from "./patioConveniadaKeys";

export const PATIO_CONVENIADA_ATUALIZACAO_MS = 30_000;

// A permanência vem pronta do servidor no instante da consulta: a atualização a cada 30 segundos a mantém em dia, e as
// baixas feitas pelo estacionamento aparecem sem a conveniada pedir. Não atualiza com a aba escondida.
// `placa` é a placa completa e válida enviada ao servidor, ou "" para a lista inteira.
export function usePatioConveniada(placa: string = "") {
  return useQuery({
    queryKey: patioConveniadaKey(placa),
    queryFn: () => listarPatioConveniada(placa),
    staleTime: PATIO_CONVENIADA_ATUALIZACAO_MS,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
    refetchInterval: PATIO_CONVENIADA_ATUALIZACAO_MS,
    refetchIntervalInBackground: false,
  });
}
