"use client";

import { InputHTMLAttributes, useId } from "react";
import { ErrorText, Field, Label, StyledInput } from "./Input.styles";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field>
      <Label htmlFor={inputId}>{label}</Label>
      <StyledInput
        id={inputId}
        $hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && <ErrorText id={`${inputId}-error`}>{error}</ErrorText>}
    </Field>
  );
}
