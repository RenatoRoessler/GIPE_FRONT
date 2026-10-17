"use client";

import type { KeyboardEvent } from "react";
import { Input } from "@/components/ui/Input";
import { normalizePlaca } from "@/lib/placa";
import type { SaidaBuscaValues } from "@/lib/schemas/saida";
import { FieldGrid, Hint } from "../Saida.styles";
import { Aviso, Divisor, Wrapper } from "./BuscaManualSaida.styles";

export type SaidaBuscaField = keyof SaidaBuscaValues;

export interface BuscaManualSaidaProps {
  values: SaidaBuscaValues;
  errors: Partial<Record<SaidaBuscaField, string>>;
  onChange: (field: SaidaBuscaField, value: string) => void;
  // Enter em qualquer campo pede a consulta sem esperar o debounce.
  onEnter?: () => void;
  // Aviso da última consulta (ex.: veículo não encontrado).
  aviso?: string;
  // Leitura por QR ativa: os campos mostram o veículo lido, mas não aceitam digitação.
  bloqueadoPorQr?: boolean;
  disabled?: boolean;
}

const LABELS: Record<SaidaBuscaField, string> = {
  placa: "Placa",
  codigoTicket: "Código do ticket",
  sequencial: "Sequencial",
};

export const BUSCA_QR_ATIVA_HINT = "Leitura por QR ativa. Toque em Limpar para digitar.";

// A API aceita um único identificador: ao preencher um campo, os outros ficam bloqueados.
export function BuscaManualSaida({
  values,
  errors,
  onChange,
  onEnter,
  aviso,
  bloqueadoPorQr = false,
  disabled = false,
}: BuscaManualSaidaProps) {
  const filled = (Object.keys(LABELS) as SaidaBuscaField[]).find((field) => values[field] !== "");

  function fieldProps(field: SaidaBuscaField) {
    const blocked = !bloqueadoPorQr && filled !== undefined && filled !== field;
    return {
      label: LABELS[field],
      value: values[field],
      error: errors[field],
      disabled: disabled || bloqueadoPorQr || blocked,
      hint: blocked ? `Limpe o campo ${LABELS[filled].toLowerCase()} para usar outro.` : undefined,
      autoComplete: "off",
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter?.();
        }
      },
    };
  }

  return (
    <Wrapper>
      <Divisor>ou informe sem QR Code</Divisor>
      <Hint>{bloqueadoPorQr ? BUSCA_QR_ATIVA_HINT : "Informe a placa, o código do ticket ou o sequencial do veículo."}</Hint>
      <FieldGrid>
        <Input
          {...fieldProps("placa")}
          onChange={(event) => onChange("placa", normalizePlaca(event.target.value))}
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={7}
        />
        <Input
          {...fieldProps("codigoTicket")}
          onChange={(event) => onChange("codigoTicket", event.target.value)}
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Input
          {...fieldProps("sequencial")}
          onChange={(event) => onChange("sequencial", event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
        />
      </FieldGrid>
      <Aviso aria-live="polite">{aviso}</Aviso>
    </Wrapper>
  );
}
