"use client";

import { ButtonHTMLAttributes } from "react";
import { ButtonSize, ButtonVariant, StyledButton } from "./Button.styles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return <StyledButton $variant={variant} $size={size} {...props} />;
}
