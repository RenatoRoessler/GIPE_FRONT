"use client";

import { useQuery } from "@tanstack/react-query";
import { obterResumo } from "@/lib/api/services/conferenciaPatio";
import { conferenciaResumoKey } from "./conferenciaKeys";

// Tela inicial: o pátio agora, a última conferência e se há caixa aberto. Sempre fresco ao abrir e ao voltar para a aba.
export function useConferenciaResumo() {
  return useQuery({
    queryKey: conferenciaResumoKey,
    queryFn: obterResumo,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
