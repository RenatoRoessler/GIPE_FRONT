"use client";

import { ReactNode } from "react";
import { Screen } from "./PageBackground.styles";

export interface PageBackgroundProps {
  children: ReactNode;
}

export function PageBackground({ children }: PageBackgroundProps) {
  return <Screen>{children}</Screen>;
}
