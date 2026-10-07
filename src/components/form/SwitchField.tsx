"use client";

import { Switch } from "@/components/ui/Switch";
import { useFieldContext } from "./context";

export type SwitchFieldProps = {
  label: string;
  disabled?: boolean;
  "aria-label"?: string;
  onChange?: (checked: boolean) => void;
};

export function SwitchField({ label, disabled, onChange, ...props }: SwitchFieldProps) {
  const field = useFieldContext<boolean>();

  return (
    <Switch
      label={label}
      name={field.name}
      checked={field.state.value}
      disabled={disabled}
      onCheckedChange={(checked) => {
        field.handleChange(checked);
        onChange?.(checked);
      }}
      {...props}
    />
  );
}
