"use client";

import { ButtonHTMLAttributes } from "react";
import { Badge, StyledDiscButton } from "./DiscButton.styles";

export interface DiscButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Letra exibida no selo circular.
  badge: string;
}

// Botão de ação em pílula com selo circular, como no modelo B de sinalização.
export function DiscButton({ badge, children, type = "button", ...props }: DiscButtonProps) {
  return (
    <StyledDiscButton type={type} {...props}>
      <Badge aria-hidden="true">{badge}</Badge>
      {children}
    </StyledDiscButton>
  );
}
