"use client";

import { NumberStepper } from "@/components/ui/NumberStepper";
import { ErrorText } from "@/components/ui/Input/Input.styles";
import { formatBRL, parseMoney } from "@/lib/money";
import { useFieldContext } from "./context";

export type StepperFieldProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  // 0 grava inteiros ("15"); mais de 0 grava reais com vírgula ("70,00").
  decimals?: number;
  // Como o valor aparece; o padrão é o número, ou reais quando há casas decimais.
  format?: (value: number) => string;
  hint?: string;
  disabled?: boolean;
};

function toNumber(text: string, decimals: number): number {
  return decimals > 0 ? parseMoney(text) : /^\d+$/.test(text.trim()) ? Number(text) : Number.NaN;
}

function toText(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals).replace(".", ",") : String(value);
}

// Liga o NumberStepper a um campo de texto do formulário, mantendo o texto salvo no formato que o resto do cadastro lê.
export function StepperField({ label, min, max, step, decimals = 0, format, hint, disabled }: StepperFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
  const errorMessage = typeof error === "string" ? error : error?.message;
  const parsed = toNumber(field.state.value, decimals);
  const invalid = Number.isNaN(parsed);
  const show = format ?? (decimals > 0 ? formatBRL : undefined);

  return (
    <div>
      <NumberStepper
        label={label}
        // Vazio ou inválido aparece como "—" e o primeiro toque em − ou + leva ao mínimo.
        value={invalid ? min : parsed}
        min={min}
        max={max}
        step={step}
        decimals={decimals}
        format={invalid ? () => "—" : show}
        hint={hint}
        disabled={disabled}
        onChange={(next) => {
          field.handleChange(toText(invalid ? min : next, decimals));
          field.handleBlur();
        }}
      />
      {errorMessage && <ErrorText role="alert">{errorMessage}</ErrorText>}
    </div>
  );
}
