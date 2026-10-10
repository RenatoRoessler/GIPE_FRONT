"use client";

import { ComponentPropsWithoutRef } from "react";
import { StatusBadgeTone, StyledStatusBadge } from "./StatusBadge.styles";

export interface StatusBadgeProps extends ComponentPropsWithoutRef<"span"> {
  tone?: StatusBadgeTone;
}

// O estado sempre é dito em texto; a cor apenas reforça.
export function StatusBadge({ tone = "neutral", ...props }: StatusBadgeProps) {
  return <StyledStatusBadge $tone={tone} {...props} />;
}
