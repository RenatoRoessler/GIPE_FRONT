"use client";

import { KeyboardEvent, useId } from "react";
import { Control, Hint, Label, Number as NumberText, StepButton, Value, Wrapper } from "./NumberStepper.styles";

export interface NumberStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  // Texto de apoio ao lado do valor (ex.: "A–E").
  hint?: string;
  disabled?: boolean;
}

// Campo numérico de poucos passos: − valor +, limitado por min e max. O valor também responde às setas e a Home/End.
export function NumberStepper({ label, value, min, max, onChange, hint, disabled = false }: NumberStepperProps) {
  const labelId = useId();

  function set(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    if (clamped !== value) {
      onChange(clamped);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    const next =
      event.key === "ArrowUp" || event.key === "ArrowRight"
        ? value + 1
        : event.key === "ArrowDown" || event.key === "ArrowLeft"
          ? value - 1
          : event.key === "Home"
            ? min
            : event.key === "End"
              ? max
              : null;
    if (next !== null) {
      event.preventDefault();
      set(next);
    }
  }

  return (
    <Wrapper role="group" aria-labelledby={labelId}>
      <Label id={labelId}>{label}</Label>
      <Control>
        <StepButton type="button" aria-label={`Diminuir ${label.toLowerCase()}`} disabled={disabled || value <= min} onClick={() => set(value - 1)}>
          −
        </StepButton>
        <Value
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled || undefined}
          onKeyDown={handleKeyDown}
        >
          <NumberText>{value}</NumberText>
          {hint ? <Hint>{hint}</Hint> : null}
        </Value>
        <StepButton type="button" aria-label={`Aumentar ${label.toLowerCase()}`} disabled={disabled || value >= max} onClick={() => set(value + 1)}>
          +
        </StepButton>
      </Control>
    </Wrapper>
  );
}
