"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCan } from "@/hooks/useCan";
import { getDashboard } from "@/lib/api/services/dashboard";
import { AREA } from "@/lib/permissoes";
import type { PeriodoDashboard } from "@/types/dashboard";

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

export interface UseDashboardOptions {
  periodo: PeriodoDashboard;
  // AAAA-MM-DD; omitida = hoje (o servidor assume).
  data?: string;
}

// Uma consulta traz a Visão Geral inteira. Sem permissão (ou antes de o perfil ser conhecido) não consulta nada. Ao trocar de
// período mantém o resultado anterior na tela (`isPlaceholderData`) até o novo chegar, sem salto de layout. Não atualiza por
// intervalo: voltar ao app (foco da aba) refaz a consulta, o que mantém o "agora" (pátio e pendências) em dia.
export function useDashboard({ periodo, data }: UseDashboardOptions) {
  const podeVer = useCan(AREA.Inicio);
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, periodo, data ?? null],
    queryFn: () => getDashboard({ periodo, data }),
    enabled: podeVer,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
}
