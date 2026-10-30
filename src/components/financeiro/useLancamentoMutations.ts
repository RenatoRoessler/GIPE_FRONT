"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CAIXA_KEY } from "@/components/caixa/useCaixa";
import { cancelarLancamento, createLancamento, updateLancamento } from "@/lib/api/services/financeiro";
import type { Lancamento, LancamentoFormValues } from "@/types/financeiro";
import { FINANCEIRO_KEY } from "./queryKeys";

export type EditarLancamentoValues = { id: number; values: LancamentoFormValues; atual: Lancamento };

export function useLancamentoMutations() {
  const queryClient = useQueryClient();

  // Lançamento, fluxo e detalhe mudam juntos. Um lançamento pelo caixa mexe também no turno, então o Caixa recarrega.
  async function atualizar(peloCaixa: boolean) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: FINANCEIRO_KEY }),
      ...(peloCaixa ? [queryClient.invalidateQueries({ queryKey: CAIXA_KEY })] : []),
    ]);
  }

  // Sem retry: o cadastro não tem idempotência, e repetir lançaria o valor duas vezes.
  const criar = useMutation({
    mutationFn: (values: LancamentoFormValues) => createLancamento(values),
    retry: false,
    onSuccess: (_resultado, values) => atualizar(values.peloCaixa),
  });

  const editar = useMutation({
    mutationFn: ({ id, values, atual }: EditarLancamentoValues) => updateLancamento(id, values, atual),
    retry: false,
    onSuccess: (_resultado, { atual }) => atualizar(atual.peloCaixa),
  });

  const cancelar = useMutation({
    mutationFn: (lancamento: Lancamento) => cancelarLancamento(lancamento.financeiroLancamentoId),
    retry: false,
    onSuccess: (_resultado, lancamento) => atualizar(lancamento.peloCaixa),
  });

  return { criar, editar, cancelar };
}
