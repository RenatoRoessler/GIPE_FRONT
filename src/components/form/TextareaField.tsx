"use client";

import { Textarea, type TextareaProps } from "@/components/ui/Textarea";
import { useFieldContext } from "./context";

export type TextareaFieldProps = Omit<TextareaProps, "value" | "onChange" | "onBlur" | "id" | "name" | "error">;

export function TextareaField({ label, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <Textarea
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
