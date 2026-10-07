"use client";

import { ComponentPropsWithRef, ElementType } from "react";
import { StyledText, TextVariant } from "./Text.styles";

export interface TextProps extends ComponentPropsWithRef<"p"> {
  variant?: TextVariant;
  as?: ElementType;
}

export function Text({ variant = "body", as, ...props }: TextProps) {
  return <StyledText as={as} $variant={variant} {...props} />;
}
