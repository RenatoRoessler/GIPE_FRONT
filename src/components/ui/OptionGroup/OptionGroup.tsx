"use client";

import { useId } from "react";
import { ErrorText, Fieldset, Legend, Mark, Options, RadioInput, Tile } from "./OptionGroup.styles";

export interface OptionGroupOption {
  value: string;
  label: string;
}

export interface OptionGroupProps {
  legend: string;
  options: OptionGroupOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

// Escolha única em tiles; usa radios nativos, então setas, foco e leitor de tela vêm do navegador.
export function OptionGroup({ legend, options, value, onChange, disabled = false, error }: OptionGroupProps) {
  const name = useId();

  return (
    <Fieldset disabled={disabled} aria-invalid={Boolean(error)}>
      <Legend>{legend}</Legend>
      <Options>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <Tile key={option.value} $checked={checked} $disabled={disabled} $hasError={Boolean(error)}>
              <RadioInput
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <Mark $checked={checked} aria-hidden="true" />
              {option.label}
            </Tile>
          );
        })}
      </Options>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Fieldset>
  );
}
