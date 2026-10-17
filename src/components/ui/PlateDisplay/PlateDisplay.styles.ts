"use client";

import styled from "styled-components";

export type PlateSize = "sm" | "md" | "lg";
export type PlateVariant = "mercosul" | "antiga";

// Cores do objeto físico (a placa), iguais nos dois temas.
const PLATE_PAPER = "#FFFFFF";
const PLATE_PAPER_OLD = "#C9CDD1";
const PLATE_INK = "#14181F";

const NUMBER_SIZE: Record<PlateSize, (xl: string, lg: string) => string> = {
  sm: (_xl, lg) => lg,
  md: (xl) => xl,
  lg: (xl) => `calc(${xl} * 1.8)`,
};

export const Plate = styled.div<{ $variant: PlateVariant; $size: PlateSize }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 3px solid ${PLATE_INK};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $variant }) => ($variant === "antiga" ? PLATE_PAPER_OLD : PLATE_PAPER)};
  color: ${PLATE_INK};
  font-size: ${({ theme, $size }) => NUMBER_SIZE[$size](theme.fontSizes.xl, theme.fontSizes.lg)};
`;

export const Band = styled.span<{ $variant: PlateVariant }>`
  padding: 2px 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.2em;
  background: ${({ theme, $variant }) => ($variant === "mercosul" ? theme.colors.primary : "transparent")};
  color: ${({ theme, $variant }) => ($variant === "mercosul" ? theme.colors.onPrimary : PLATE_INK)};
  border-bottom: ${({ $variant }) => ($variant === "antiga" ? `2px solid ${PLATE_INK}` : "none")};
`;

export const PlateNumber = styled.span`
  display: block;
  padding: 0 ${({ theme }) => theme.space[2]}px;
  text-align: center;
  white-space: nowrap;
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;
