"use client";

import { ColorSwatchGroup, type ColorSwatchGroupProps } from "@/components/ui/ColorSwatchGroup";
import { useFieldContext } from "./context";

export type ColorFieldProps = Pick<ColorSwatchGroupProps, "legend" | "options" | "disabled">;

export function ColorField(props: ColorFieldProps) {
  const field = useFieldContext<string>();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;

  return (
    <ColorSwatchGroup
      {...props}
      value={field.state.value}
      onChange={(value) => field.handleChange(value)}
      error={typeof error === "string" ? error : error?.message}
    />
  );
}
