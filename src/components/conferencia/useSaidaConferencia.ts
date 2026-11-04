"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FORMA_DINHEIRO } from "@/components/veiculos/saida";
import { darSaidaPeloItem } from "@/lib/api/services/conferenciaPatio";
import { saidaConferenciaSchema, toMotivoSaida } from "@/lib/schemas/conferenciaPatio";
import type { ItemConferencia } from "@/types/conferenciaPatio";
import { atualizarAposAjuste } from "./useConferenciaAcoes";

export interface UseSaidaConferenciaOptions {
  conferenciaId: number;
  item: ItemConferencia;
  onConcluida: () => void;
}

// Dar saída, na conferência, num veículo que está no sistema mas não foi achado no pátio: só pede o motivo.
// Não há cobrança nem recibo; o back exige valor e forma, então vai valor zero em dinheiro.
export function useSaidaConferencia({ conferenciaId, item, onConcluida }: UseSaidaConferenciaOptions) {
  const queryClient = useQueryClient();
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      darSaidaPeloItem(conferenciaId, item.patioConferenciaItemId, {
        valor: 0,
        formaPagamento: Number(FORMA_DINHEIRO),
        ...toMotivoSaida(saidaConferenciaSchema.parse({ motivo, descricao })),
      }),
    onSuccess: () => {
      atualizarAposAjuste(queryClient);
      onConcluida();
    },
  });

  const validacao = saidaConferenciaSchema.safeParse({ motivo, descricao });
  const erros: { motivo?: string; descricao?: string } = {};
  if (!validacao.success) {
    for (const issue of validacao.error.issues) {
      const campo = issue.path[0] as "motivo" | "descricao";
      erros[campo] ??= issue.message;
    }
  }

  const enviando = mutation.isPending;

  return {
    motivo,
    setMotivo,
    descricao,
    setDescricao,
    erros,
    enviando,
    podeConfirmar: validacao.success && !enviando,
    erroRegistro: mutation.isError ? mutation.error.message : undefined,
    confirmar: () => {
      if (validacao.success && !mutation.isPending) {
        mutation.reset();
        mutation.mutate();
      }
    },
  };
}
