"use client";

import { InputHTMLAttributes, useId, useState } from "react";
import {
  ErrorText,
  Field,
  HintText,
  HintTone,
  InputWrapper,
  Label,
  StyledInput,
  ToggleButton,
} from "./Input.styles";

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}

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
  // Campos de senha ganham o botão para mostrar/ocultar o que foi digitado.
  const isPassword = props.type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <Field>
      <Label htmlFor={inputId}>{label}</Label>
      <InputWrapper>
        <StyledInput
          id={inputId}
          $hasError={Boolean(error)}
          $hasToggle={isPassword}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${inputId}-error` : visibleHint ? `${inputId}-hint` : undefined
          }
          {...props}
          type={isPassword && isPasswordVisible ? "text" : props.type}
        />
        {isPassword && (
          <ToggleButton
            type="button"
            aria-label={`${isPasswordVisible ? "Ocultar" : "Mostrar"} senha (${label})`}
            aria-pressed={isPasswordVisible}
            aria-controls={inputId}
            disabled={props.disabled}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            <EyeIcon crossed={isPasswordVisible} />
          </ToggleButton>
        )}
      </InputWrapper>
      {error && <ErrorText id={`${inputId}-error`}>{error}</ErrorText>}
      {visibleHint && (
        <HintText id={`${inputId}-hint`} role="status" $tone={hintTone}>
          {visibleHint}
        </HintText>
      )}
    </Field>
  );
}
