"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelarFatura, emitirFatura, pagarFatura } from "@/lib/api/services/fatura";
import type { EmitirFaturaValues, PagarFaturaValues } from "@/types/fatura";
import { FATURAS_KEY } from "./queryKeys";

export type PagarFaturaVariaveis = { id: number; values: PagarFaturaValues; hoje: string };

export function useFaturaMutations() {
  const queryClient = useQueryClient();

  // Lista e detalhe mudam juntos: as saídas trocam de situação e a fatura também.
  const atualizar = () => queryClient.invalidateQueries({ queryKey: FATURAS_KEY });

  // Sem retry: nenhuma das três tem idempotência. Repetir emitiria duas faturas ou registraria o pagamento duas vezes.
  const emitir = useMutation({
    mutationFn: (values: EmitirFaturaValues) => emitirFatura(values),
    retry: false,
    onSuccess: atualizar,
  });

  const pagar = useMutation({
    mutationFn: ({ id, values, hoje }: PagarFaturaVariaveis) => pagarFatura(id, values, hoje),
    retry: false,
    onSuccess: atualizar,
  });

  const cancelar = useMutation({
    mutationFn: (id: number) => cancelarFatura(id),
    retry: false,
    onSuccess: atualizar,
  });

  return { emitir, pagar, cancelar };
}
