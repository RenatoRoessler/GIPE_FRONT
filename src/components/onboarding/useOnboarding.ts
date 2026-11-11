"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { getOnboarding, marcarOnboardingVisualizado } from "@/lib/api/services/onboarding";
import type { Onboarding } from "@/types/onboarding";

export const ONBOARDING_QUERY_KEY = ["onboarding"] as const;

// Consulta se a pessoa já viu o tour. Sem usuário conhecido não consulta; se falhar, o tour simplesmente não abre.
export function useOnboarding() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: getOnboarding,
    enabled: Boolean(user),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// O cache recebe o que o back acabou de confirmar, sem nova consulta: o tour não reabre se ela atrasar.
export function useMarcarVisualizado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marcarOnboardingVisualizado,
    onSuccess: () => {
      queryClient.setQueryData<Onboarding>(ONBOARDING_QUERY_KEY, { visualizado: true, dataVisualizacao: new Date().toISOString() });
    },
  });
}
