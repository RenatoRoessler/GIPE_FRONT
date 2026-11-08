"use client";

import { TextareaHTMLAttributes, useId } from "react";
import { ErrorText, Field, Label } from "@/components/ui/Input/Input.styles";
import { Counter, Footer, StyledTextarea } from "./Textarea.styles";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "maxLength"> {
  label: string;
  value: string;
  error?: string;
  // Mostra o contador "n / limite". O campo não corta o texto: passar do limite é erro de quem valida.
  limite?: number;
}

export function Textarea({ label, value, error, limite, id, rows = 3, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const excedido = limite !== undefined && value.length > limite;
  const describedBy = [error ? `${textareaId}-error` : null, limite !== undefined ? `${textareaId}-counter` : null].filter(Boolean).join(" ");

  return (
    <Field>
      <Label htmlFor={textareaId}>{label}</Label>
      <StyledTextarea
        as="textarea"
        id={textareaId}
        rows={rows}
        value={value}
        $hasError={Boolean(error) || excedido}
        aria-invalid={Boolean(error) || excedido}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {error && <ErrorText id={`${textareaId}-error`}>{error}</ErrorText>}
      {limite !== undefined && (
        <Footer>
          <Counter id={`${textareaId}-counter`} $excedido={excedido}>
            {value.length} / {limite}
          </Counter>
        </Footer>
      )}
    </Field>
  );
}
