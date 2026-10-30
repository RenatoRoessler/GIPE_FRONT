"use client";

import { useId } from "react";
import {
  Dot,
  ErrorText,
  Fieldset,
  Hint,
  Legend,
  RadioInput,
  SelectedName,
  Swatch,
  Swatches,
} from "./ColorSwatchGroup.styles";

export interface ColorSwatchOption {
  value: string;
  label: string;
  color: string;
}

export interface ColorSwatchGroupProps {
  legend: string;
  options: readonly ColorSwatchOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  // Texto de apoio abaixo das amostras (ex.: a cor do cadastro, quando não está na lista).
  hint?: string;
}

// Escolha única de cor em amostras; usa radios nativos (setas, foco e leitor de tela vêm do navegador).
export function ColorSwatchGroup({
  legend,
  options,
  value,
  onChange,
  disabled = false,
  error,
  hint,
}: ColorSwatchGroupProps) {
  const name = useId();
  const selected = options.find((option) => option.value === value);

  return (
    <Fieldset disabled={disabled} aria-invalid={Boolean(error)}>
      <Legend>
        {legend}
        <SelectedName aria-live="polite">{selected?.label ?? ""}</SelectedName>
      </Legend>
      <Swatches>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <Swatch key={option.value} $disabled={disabled} title={option.label}>
              <RadioInput
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                aria-label={option.label}
                onChange={() => onChange(option.value)}
              />
              <Dot $color={option.color} $checked={checked} aria-hidden="true" />
            </Swatch>
          );
        })}
      </Swatches>
      {hint && !error && <Hint>{hint}</Hint>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Fieldset>
  );
}
