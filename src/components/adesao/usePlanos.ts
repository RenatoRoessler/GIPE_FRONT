"use client";

import { useQuery } from "@tanstack/react-query";
import { listPlanos } from "@/lib/api/services/plano";

export const PLANOS_QUERY_KEY = ["planos"] as const;

const CINCO_MINUTOS = 5 * 60_000;

// Os planos vêm do back-end. O cache de 5 minutos mantém o preço estável durante o cadastro, e não refazer ao
// voltar para a janela evita o valor mudar sob o usuário. Uma nova tentativa só: quem espera vê a tela de carregamento.
export function usePlanos() {
  return useQuery({
    queryKey: PLANOS_QUERY_KEY,
    queryFn: ({ signal }) => listPlanos(signal),
    staleTime: CINCO_MINUTOS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
