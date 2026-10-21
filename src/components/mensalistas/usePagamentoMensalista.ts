"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { pagarMensalista } from "@/lib/api/services/mensalista";
import type { FormaPagamentoId } from "@/types/caixa";
import type { PagamentoMensalistaResultado } from "@/types/mensalista";
import { classificarErroPagamento } from "./pagamento";
import { contratoQueryKey } from "./useContratosMensalistas";
import { MENSALISTAS_QUERY_KEY } from "./useTiposMensalidade";

export type PagarValues = { mensalistaId: number; valorPago: number; formaPagamento: FormaPagamentoId };

export interface UsePagamentoMensalistaOptions {
  onSuccess?: (resultado: PagamentoMensalistaResultado) => void;
}

export function usePagamentoMensalista({ onSuccess }: UsePagamentoMensalistaOptions = {}) {
  const queryClient = useQueryClient();
  // O estado do React só muda no próximo render: dois cliques no mesmo tick precisam de uma trava síncrona.
  const emAndamento = useRef(false);

  const mutation = useMutation({
    mutationFn: (values: PagarValues) => pagarMensalista(values),
    // Pagamento não é repetido sem decisão do operador: sem idempotência na API, repetir pode baixar duas cobranças.
    retry: false,
    onSuccess: async (resultado) => {
      await queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY });
      onSuccess?.(resultado);
    },
    onError: async (error, values) => {
      // O aceite pode ter acontecido em outra aba: a situação do contrato se corrige.
      if (classificarErroPagamento(error).kind === "contrato-nao-aceito") {
        await queryClient.invalidateQueries({ queryKey: contratoQueryKey(values.mensalistaId) });
      }
    },
    onSettled: () => {
      emAndamento.current = false;
    },
  });

  return {
    pagar: (values: PagarValues) => {
      if (emAndamento.current) {
        return;
      }
      emAndamento.current = true;
      mutation.mutate(values);
    },
    isPending: mutation.isPending,
    resultado: mutation.data ?? null,
    erro: mutation.error ? classificarErroPagamento(mutation.error) : null,
    // Volta ao formulário (ex.: depois de um erro); o que o operador digitou fica no formulário.
    reset: mutation.reset,
  };
}
