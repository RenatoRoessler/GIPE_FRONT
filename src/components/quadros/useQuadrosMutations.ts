"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { excluirPosicao, inativarQuadro } from "@/lib/api/services/quadroChaves";
import { QUADROS_QUERY_KEY } from "./quadrosKeys";

// Só inativa se nenhum veículo no pátio estiver com a chave numa posição do quadro: o erro do back diz quais placas.
export function useInativarQuadro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patioQuadroId: number) => inativarQuadro(patioQuadroId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY }),
  });
}

// Só exclui se nenhum veículo no pátio estiver com a chave nessa posição.
export function useExcluirPosicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patioQuadroChaveId: number) => excluirPosicao(patioQuadroChaveId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY }),
  });
}
