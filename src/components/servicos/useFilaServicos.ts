"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listFila } from "@/lib/api/services/servico";
import type { StatusServico } from "@/types/servico";
import { filaServicosKey } from "./servicosKeys";

// A fila muda por quem trabalha nela e por quem acrescenta serviços; o back não avisa, então ela se atualiza sozinha
// enquanto a aba está à vista e ao voltar para ela. Em segundo plano não gasta rede.
export const INTERVALO_FILA_MS = 15_000;

export function useFilaServicos(status?: StatusServico) {
  const query = useQuery({
    queryKey: filaServicosKey(status),
    queryFn: () => listFila(status),
    staleTime: 0,
    refetchInterval: INTERVALO_FILA_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    // Os cartões continuam na tela enquanto a lista recarrega.
    placeholderData: keepPreviousData,
  });

  return {
    itens: query.data ?? [],
    carregando: query.isPending,
    erro: query.error,
    refetch: query.refetch,
    // Quando a lista chegou pela última vez; 0 antes da primeira resposta.
    atualizadoEm: query.dataUpdatedAt,
  };
}
