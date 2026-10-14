"use client";

import { useState } from "react";
import { conferenciaSchema, type ConferenciaFormValues } from "@/lib/schemas/caixa";
import type { TurnoFormaPagamento } from "@/types/caixa";

export type ConferenciaErrors = { conferencias: Record<number, string>; valorInicial?: string };

// Estado e validação da conferência por forma de pagamento (passagem de turno e fechamento).
export function useConferencia(formas: TurnoFormaPagamento[]) {
  const [values, setValues] = useState<ConferenciaFormValues>(() => ({
    conferencias: formas.map(() => ""),
    valorInicial: "",
    observacao: "",
  }));
  const [errors, setErrors] = useState<ConferenciaErrors>({ conferencias: {} });

  function setConferencia(index: number, value: string) {
    setValues((current) => ({
      ...current,
      conferencias: current.conferencias.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function setField(field: "valorInicial" | "observacao", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Devolve os valores válidos ou null (e preenche os erros por campo).
  function validate(): ConferenciaFormValues | null {
    const result = conferenciaSchema.safeParse(values);
    if (result.success) {
      setErrors({ conferencias: {} });
      return result.data;
    }
    const next: ConferenciaErrors = { conferencias: {} };
    for (const issue of result.error.issues) {
      const [field, index] = issue.path;
      if (field === "conferencias" && typeof index === "number") {
        next.conferencias[index] ??= issue.message;
      } else if (field === "valorInicial") {
        next.valorInicial ??= issue.message;
      }
    }
    setErrors(next);
    return null;
  }

  return { values, errors, setConferencia, setField, validate };
}
