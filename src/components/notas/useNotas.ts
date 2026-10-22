"use client";

import { useQuery } from "@tanstack/react-query";
import { listNotasLancadas, listNotasPendentes } from "@/lib/api/services/notaFiscal";
import type { PeriodoNotas } from "@/types/notaFiscal";
import { NOTAS_LANCADAS_KEY, NOTAS_PENDENTES_KEY } from "./notasKeys";

// Solicitações dos clientes aguardando lançamento; o back não pagina.
export function useNotasPendentes() {
  return useQuery({
    queryKey: NOTAS_PENDENTES_KEY,
    queryFn: listNotasPendentes,
    refetchOnWindowFocus: false,
  });
}

// Notas lançadas no período; cada período tem a própria consulta em cache.
export function useNotasLancadas(periodo: PeriodoNotas) {
  return useQuery({
    queryKey: [...NOTAS_LANCADAS_KEY, periodo.de, periodo.ate],
    queryFn: () => listNotasLancadas(periodo),
    refetchOnWindowFocus: false,
  });
}
