"use client";

import { useId } from "react";
import { Chip, Chips, Fieldset, Legend, RadioInput } from "./QuickAmountChips.styles";

export interface QuickAmountOption {
  value: string;
  label: string;
}

export interface QuickAmountChipsProps {
  legend: string;
  options: QuickAmountOption[];
  // Nulo quando nenhuma opção foi escolhida.
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Escolha única de valores rápidos (ex.: "Exato", "R$ 250", "Outro"), com rádios nativos.
export function QuickAmountChips({ legend, options, value, onChange, disabled = false }: QuickAmountChipsProps) {
  const name = useId();
  return (
    <Fieldset disabled={disabled}>
      <Legend>{legend}</Legend>
      <Chips>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <Chip key={option.value} $checked={checked} $disabled={disabled}>
              <RadioInput
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </Chip>
          );
        })}
      </Chips>
    </Fieldset>
  );
}
