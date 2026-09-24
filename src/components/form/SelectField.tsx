"use client";

import { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/Select";
import { useFieldContext } from "./context";

export type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange" | "onBlur" | "id" | "name"
> & {
  label: string;
};

export function SelectField({ label, children, ...props }: SelectFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <Select
      label={label}
      name={field.name}
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
      onBlur={field.handleBlur}
      error={typeof error === "string" ? error : error?.message}
      {...props}
    >
      {children}
    </Select>
  );
}
