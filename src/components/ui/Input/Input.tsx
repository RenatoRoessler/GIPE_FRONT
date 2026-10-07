"use client";

import { InputHTMLAttributes, useId } from "react";
import { ErrorText, Field, HintText, HintTone, Label, StyledInput } from "./Input.styles";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  // Texto de apoio anunciado por leitores de tela; não é exibido enquanto houver `error`.
  hint?: string;
  hintTone?: HintTone;
}

export function Input({ label, error, hint, hintTone = "muted", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const visibleHint = error ? undefined : hint;

  return (
    <Field>
      <Label htmlFor={inputId}>{label}</Label>
      <StyledInput
        id={inputId}
        $hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : visibleHint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {error && <ErrorText id={`${inputId}-error`}>{error}</ErrorText>}
      {visibleHint && (
        <HintText id={`${inputId}-hint`} role="status" $tone={hintTone}>
          {visibleHint}
        </HintText>
      )}
    </Field>
  );
}
