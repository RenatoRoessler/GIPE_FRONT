"use client";

import { OptionGroup, type OptionGroupProps } from "@/components/ui/OptionGroup";
import { useFieldContext } from "./context";

export type OptionFieldProps = Pick<OptionGroupProps, "legend" | "options" | "disabled">;

export function OptionField(props: OptionFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <OptionGroup
      {...props}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      error={typeof error === "string" ? error : error?.message}
    />
  );
}
