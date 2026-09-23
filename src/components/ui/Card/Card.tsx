"use client";

import { HTMLAttributes } from "react";
import { StyledCard } from "./Card.styles";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: string;
}

export function Card({ maxWidth = "480px", ...props }: CardProps) {
  return <StyledCard $maxWidth={maxWidth} {...props} />;
}
