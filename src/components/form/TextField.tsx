"use client";

import { InputHTMLAttributes } from "react";
import { Input, type InputProps } from "@/components/ui/Input";
import { useFieldContext } from "./context";

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur" | "id" | "name"
> & {
  label: string;
  hint?: InputProps["hint"];
  hintTone?: InputProps["hintTone"];
  // Normaliza o valor digitado antes de gravar no formulário (ex.: máscara, só dígitos).
  format?: (value: string) => string;
};

export function TextField({ label, format, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <Input
      label={label}
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(format ? format(event.target.value) : event.target.value)}
      onBlur={field.handleBlur}
      error={typeof error === "string" ? error : error?.message}
      {...props}
    />
  );
}
