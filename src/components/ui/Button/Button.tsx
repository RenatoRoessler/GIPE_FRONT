"use client";

import { ButtonHTMLAttributes, Ref } from "react";
import { ButtonSize, ButtonVariant, StyledButton } from "./Button.styles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // React 19: ref é uma prop comum (ex.: devolver o foco ao botão depois de remover um item).
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return <StyledButton $variant={variant} $size={size} {...props} />;
}
