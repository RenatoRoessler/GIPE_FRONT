"use client";

import { InputHTMLAttributes, useId } from "react";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { ErrorText, Field, HintText, Label, type HintTone } from "@/components/ui/Input/Input.styles";
import { normalizePlaca } from "@/lib/placa";
import { useFieldContext } from "./context";
import { PlateFrame, PlateInput } from "./PlateField.styles";

export type PlateFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur" | "id" | "name"
> & {
  label: string;
  hint?: string;
  hintTone?: HintTone;
};

// Campo de placa: o texto digitado aparece sobre uma placa que muda de aspecto (Mercosul ou antiga).
export function PlateField({ label, hint, hintTone = "muted", ...props }: PlateFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();
  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
  const errorText = typeof error === "string" ? error : error?.message;
  const visibleHint = errorText ? undefined : hint;

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <PlateFrame>
        <PlateDisplay value={field.state.value} size="lg">
          <PlateInput
            id={id}
            name={field.name}
            value={field.state.value}
            onChange={(event) => field.handleChange(normalizePlaca(event.target.value))}
            onBlur={field.handleBlur}
            placeholder="ABC1D23"
            maxLength={7}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={Boolean(errorText)}
            aria-describedby={errorText ? `${id}-error` : visibleHint ? `${id}-hint` : undefined}
            {...props}
          />
        </PlateDisplay>
      </PlateFrame>
      {errorText && <ErrorText id={`${id}-error`}>{errorText}</ErrorText>}
      {visibleHint && (
        <HintText id={`${id}-hint`} role="status" $tone={hintTone}>
          {visibleHint}
        </HintText>
      )}
    </Field>
  );
}
