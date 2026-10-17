"use client";

import { LabelText, Thumb, Track, Wrapper } from "./Switch.styles";

export interface SwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  // Marca o campo com erro para o foco do formulário (aria-invalid não vale para role="switch").
  invalid?: boolean;
}

export function Switch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
  name,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  invalid = false,
}: SwitchProps) {
  return (
    <Wrapper $disabled={disabled}>
      <Track
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        aria-describedby={describedBy}
        data-invalid={invalid || undefined}
        disabled={disabled}
        $checked={checked}
        onClick={() => onCheckedChange(!checked)}
      >
        <Thumb $checked={checked} />
      </Track>
      <LabelText>{label}</LabelText>
    </Wrapper>
  );
}
