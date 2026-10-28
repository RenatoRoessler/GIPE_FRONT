"use client";

import type { PatioVeiculo } from "@/types/patio";
import { usePatio, type UsePatioOptions } from "./usePatio";

// O detalhe lê o veículo da mesma lista do Pátio (não há consulta de ticket por id). `ausente` só vale depois da
// primeira carga: antes disso, ou com a lista falhando, o veículo simplesmente ainda não está disponível.
export function usePatioVeiculo(patioId: number, options: UsePatioOptions = {}) {
  const consulta = usePatio(options);
  const veiculo: PatioVeiculo | null = consulta.data?.find((item) => item.patioId === patioId) ?? null;
  return {
    veiculo,
    carregando: consulta.isPending,
    ausente: consulta.data !== undefined && veiculo === null,
    erro: consulta.isError && consulta.data === undefined ? consulta.error : null,
    atualizando: consulta.isFetching,
    recarregar: consulta.refetch,
  };
}
