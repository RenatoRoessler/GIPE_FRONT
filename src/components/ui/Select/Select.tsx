"use client";

import { ReactNode, SelectHTMLAttributes, useId } from "react";
import {
  Chevron,
  ErrorText,
  Field,
  Label,
  SelectWrapper,
  StyledSelect,
} from "./Select.styles";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, id, children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field>
      <Label htmlFor={selectId}>{label}</Label>
      <SelectWrapper>
        <StyledSelect
          id={selectId}
          $hasError={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {children}
        </StyledSelect>
        <Chevron viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Chevron>
      </SelectWrapper>
      {error && <ErrorText id={`${selectId}-error`}>{error}</ErrorText>}
    </Field>
  );
}
