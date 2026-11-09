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
  // Quanto − e + e as setas andam por vez.
  step?: number;
  // Como o valor aparece (ex.: em reais); o padrão é o próprio número.
  format?: (value: number) => string;
  // Casas decimais do valor, para o passo não acumular erro de ponto flutuante.
  decimals?: number;
}

// Campo numérico de poucos passos: − valor +, limitado por min e max. O valor também responde às setas e a Home/End.
export function NumberStepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
  disabled = false,
  step = 1,
  format,
  decimals = 0,
}: NumberStepperProps) {
  const labelId = useId();

  function set(next: number) {
    const clamped = Math.min(max, Math.max(min, Number(next.toFixed(decimals))));
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
        ? value + step
        : event.key === "ArrowDown" || event.key === "ArrowLeft"
          ? value - step
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
        <StepButton type="button" aria-label={`Diminuir ${label.toLowerCase()}`} disabled={disabled || value <= min} onClick={() => set(value - step)}>
          −
        </StepButton>
        <Value
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuenow={value}
          aria-valuetext={format ? format(value) : undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled || undefined}
          onKeyDown={handleKeyDown}
        >
          <NumberText>{format ? format(value) : value}</NumberText>
          {hint ? <Hint>{hint}</Hint> : null}
        </Value>
        <StepButton type="button" aria-label={`Aumentar ${label.toLowerCase()}`} disabled={disabled || value >= max} onClick={() => set(value + step)}>
          +
        </StepButton>
      </Control>
    </Wrapper>
  );
}
