"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { DIAS_TIPO, type DiasTipo } from "@/types/mensalista";
import { Days, ErrorText, Fieldset, Legend } from "./DiasAtendimento.styles";

export interface DiasAtendimentoProps {
  value: DiasTipo;
  onChange: (value: DiasTipo) => void;
  error?: string;
  disabled?: boolean;
}

export function DiasAtendimento({ value, onChange, error, disabled = false }: DiasAtendimentoProps) {
  return (
    <Fieldset disabled={disabled} aria-invalid={Boolean(error)}>
      <Legend>Dias de atendimento</Legend>
      <Days>
        {DIAS_TIPO.map((dia) => (
          <Checkbox
            key={dia.key}
            label={dia.label}
            checked={value[dia.key]}
            disabled={disabled}
            onCheckedChange={(checked) => onChange({ ...value, [dia.key]: checked })}
          />
        ))}
      </Days>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Fieldset>
  );
}
