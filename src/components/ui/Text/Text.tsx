"use client";

import { ElementType, HTMLAttributes } from "react";
import { StyledText, TextVariant } from "./Text.styles";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  as?: ElementType;
}

export function Text({ variant = "body", as, ...props }: TextProps) {
  return <StyledText as={as} $variant={variant} {...props} />;
}
