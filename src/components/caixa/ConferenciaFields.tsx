"use client";

import { Input } from "@/components/ui/Input";
import type { TurnoFormaPagamento } from "@/types/caixa";
import { FieldStack, Hint } from "./Caixa.styles";
import { formaPagamentoLabel } from "./format";

export interface ConferenciaFieldsProps {
  formas: TurnoFormaPagamento[];
  values: string[];
  errors?: Record<number, string>;
  onChange: (index: number, value: string) => void;
  disabled?: boolean;
}

// Um valor conferido por forma de pagamento; campo vazio conta como zero.
export function ConferenciaFields({ formas, values, errors, onChange, disabled }: ConferenciaFieldsProps) {
  return (
    <FieldStack>
      <Hint>Informe o valor conferido em cada forma de pagamento. Formas sem valor serão contadas como zero.</Hint>
      {formas.map((forma, index) => (
        <Input
          key={forma.formaPagamento}
          label={formaPagamentoLabel(forma.formaPagamento)}
          inputMode="decimal"
          placeholder="0,00"
          value={values[index] ?? ""}
          onChange={(event) => onChange(index, event.target.value)}
          error={errors?.[index]}
          disabled={disabled}
          autoFocus={index === 0}
        />
      ))}
    </FieldStack>
  );
}
