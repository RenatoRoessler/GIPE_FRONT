"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { PATIO_CONVENIADA_KEY } from "@/components/patio-conveniada/patioConveniadaKeys";
import { carimbarTicket } from "@/lib/api/services/carimbo";

// Depois de uma tentativa que falhou, o mesmo QR ainda diante da câmera não dispara outra chamada por este tempo.
export const REPETICAO_TOKEN_MS = 5000;

// Carimba o ticket lido. Uma chamada por vez: enquanto uma está em andamento, novas leituras são ignoradas.
export function useCarimbar() {
  const queryClient = useQueryClient();
  const ultimaFalha = useRef<{ token: string; em: number } | null>(null);
  const ultimoToken = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (token: string) => carimbarTicket(token),
    onMutate: (token) => {
      ultimoToken.current = token;
    },
    onError: (_error, token) => {
      ultimaFalha.current = { token, em: Date.now() };
    },
    onSuccess: () => {
      ultimaFalha.current = null;
      // O veículo carimbado passa a fazer parte do pátio da conveniada.
      void queryClient.invalidateQueries({ queryKey: PATIO_CONVENIADA_KEY });
    },
  });

  // Chamado a cada QR lido; devolve se a chamada foi disparada.
  function carimbar(token: string): boolean {
    if (mutation.isPending || mutation.isSuccess) {
      return false;
    }
    const falha = ultimaFalha.current;
    if (falha && falha.token === token && Date.now() - falha.em < REPETICAO_TOKEN_MS) {
      return false;
    }
    mutation.mutate(token);
    return true;
  }

  // Reenvia o último token, sem nova leitura (ex.: depois de uma falha de conexão).
  function tentarNovamente() {
    if (ultimoToken.current !== null && !mutation.isPending) {
      mutation.mutate(ultimoToken.current);
    }
  }

  function reiniciar() {
    mutation.reset();
    ultimaFalha.current = null;
  }

  return { ...mutation, carimbar, tentarNovamente, reiniciar };
}
