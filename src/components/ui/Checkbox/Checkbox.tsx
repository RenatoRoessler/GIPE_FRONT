"use client";

import { useId } from "react";
import { Box, Hint, LabelText, NativeInput, TextGroup, Wrapper } from "./Checkbox.styles";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  name?: string;
}

export function Checkbox({
  label,
  checked,
  onCheckedChange,
  hint,
  disabled = false,
  name,
}: CheckboxProps) {
  const hintId = useId();

  return (
    <Wrapper $disabled={disabled}>
      <NativeInput
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <Box $checked={checked} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7.5L5.5 10.5L11.5 3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      <TextGroup>
        <LabelText>{label}</LabelText>
        {hint && <Hint id={hintId}>{hint}</Hint>}
      </TextGroup>
    </Wrapper>
  );
}
