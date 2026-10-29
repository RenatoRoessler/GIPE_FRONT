"use client";

import { Combobox, type ComboboxProps } from "@/components/ui/Combobox";
import { useFieldContext } from "./context";

export type ComboboxFieldProps = Omit<ComboboxProps, "value" | "onChange" | "onBlur" | "id" | "name" | "error">;

export function ComboboxField(props: ComboboxFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <Combobox
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      error={typeof error === "string" ? error : error?.message}
      {...props}
    />
  );
}
