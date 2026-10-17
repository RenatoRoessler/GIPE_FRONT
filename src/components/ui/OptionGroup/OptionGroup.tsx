"use client";

import { ReactNode, useId } from "react";
import { ErrorText, Fieldset, IconSlot, Legend, Mark, Options, RadioInput, Tile } from "./OptionGroup.styles";

export interface OptionGroupOption {
  value: string;
  label: string;
  // Ícone decorativo (o rótulo continua sendo o nome acessível); com ícone o tile fica em coluna.
  icon?: ReactNode;
}

export interface OptionGroupProps {
  legend: string;
  options: OptionGroupOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  // Fixa o número de colunas em qualquer largura (por padrão, 2 ou 3 conforme o ícone e a tela).
  columns?: number;
}

// Escolha única em tiles; usa radios nativos, então setas, foco e leitor de tela vêm do navegador.
export function OptionGroup({ legend, options, value, onChange, disabled = false, error, columns }: OptionGroupProps) {
  const name = useId();

  return (
    <Fieldset disabled={disabled} aria-invalid={Boolean(error)}>
      <Legend>{legend}</Legend>
      <Options $withIcon={options.some((option) => Boolean(option.icon))} $columns={columns}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <Tile key={option.value} $checked={checked} $disabled={disabled} $hasError={Boolean(error)} $withIcon={Boolean(option.icon)}>
              <RadioInput
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <Mark $checked={checked} $withIcon={Boolean(option.icon)} aria-hidden="true" />
              {option.icon && <IconSlot aria-hidden="true">{option.icon}</IconSlot>}
              {option.label}
            </Tile>
          );
        })}
      </Options>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Fieldset>
  );
}
