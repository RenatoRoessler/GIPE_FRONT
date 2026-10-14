"use client";

import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { normalizePlaca } from "@/lib/placa";
import type { SaidaBuscaValues } from "@/lib/schemas/saida";
import { FieldGrid, Hint, StepForm } from "../Saida.styles";

export type SaidaBuscaField = keyof SaidaBuscaValues;

export interface ConsultaSaidaStepProps {
  formId: string;
  values: SaidaBuscaValues;
  errors: Partial<Record<SaidaBuscaField, string>>;
  onChange: (field: SaidaBuscaField, value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: string;
}

const LABELS: Record<SaidaBuscaField, string> = {
  placa: "Placa",
  codigoTicket: "Código do ticket",
  sequencial: "Sequencial",
};

// A API aceita um único identificador: ao preencher um campo, os outros ficam bloqueados.
export function ConsultaSaidaStep({
  formId,
  values,
  errors,
  onChange,
  onSubmit,
  isPending,
  error,
}: ConsultaSaidaStepProps) {
  const filled = (Object.keys(LABELS) as SaidaBuscaField[]).find((field) => values[field] !== "");

  function fieldProps(field: SaidaBuscaField) {
    const blocked = filled !== undefined && filled !== field;
    return {
      label: LABELS[field],
      value: values[field],
      error: errors[field],
      disabled: isPending || blocked,
      hint: blocked ? `Limpe o campo ${LABELS[filled].toLowerCase()} para usar outro.` : undefined,
    };
  }

  return (
    <StepForm
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Hint>Informe a placa, o código do ticket ou o sequencial do veículo.</Hint>
      {error && <ErrorBanner role="alert">{error}</ErrorBanner>}
      <FieldGrid>
        <Input
          {...fieldProps("placa")}
          onChange={(event) => onChange("placa", normalizePlaca(event.target.value))}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={7}
        />
        <Input
          {...fieldProps("codigoTicket")}
          onChange={(event) => onChange("codigoTicket", event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="off"
        />
        <Input
          {...fieldProps("sequencial")}
          onChange={(event) => onChange("sequencial", event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="off"
        />
      </FieldGrid>
    </StepForm>
  );
}
