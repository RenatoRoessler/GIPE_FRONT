"use client";

import { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";
import { useFieldContext } from "./context";

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur" | "id" | "name"
> & {
  label: string;
};

export function TextField({ label, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <Input
      label={label}
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
      onBlur={field.handleBlur}
      error={typeof error === "string" ? error : error?.message}
      {...props}
    />
  );
}
