"use client";

import { LabelText, Thumb, Track, Wrapper } from "./Switch.styles";

export interface SwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
}

export function Switch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
  name,
  "aria-label": ariaLabel,
}: SwitchProps) {
  return (
    <Wrapper $disabled={disabled}>
      <Track
        type="button"
        role="switch"
        name={name}
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
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
