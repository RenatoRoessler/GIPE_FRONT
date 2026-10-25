"use client";

import styled from "styled-components";

// "Placa tarifária": painel com os degraus tempo → valor.
export type PlateSize = "md" | "lg";

export const Plate = styled.section<{ $size: PlateSize }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme, $size }) => ($size === "lg" ? theme.space[5] : theme.space[4])}px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.shadows.sm};
`;

export const PlateHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Selo "Conveniada −30%": o percentual do desconto da tabela de convênio.
export const ConveniadaTag = styled.span`
  padding: 2px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.warn};
  color: ${({ theme }) => theme.colors.onWarn};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

export const PlateTitle = styled.h3`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
`;

export const Steps = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  font-variant-numeric: tabular-nums;
`;

export const Step = styled.li<{ $size: PlateSize }>`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  border-bottom: 2px dashed ${({ theme }) => theme.colors.border};
  font-size: ${({ theme, $size }) => ($size === "lg" ? theme.fontSizes.lg : theme.fontSizes.md)};

  &:last-child {
    border-bottom: none;
  }
`;

export const StepValue = styled.span<{ $size: PlateSize }>`
  ${({ theme, $size }) =>
    $size === "lg" &&
    `
    font-family: ${theme.typography.display};
    font-size: ${theme.fontSizes.xl};
    text-transform: ${theme.typography.displayTransform};
  `}
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const DailyRate = styled.p<{ $size: PlateSize }>`
  margin: 0;
  padding-top: ${({ theme }) => theme.space[2]}px;
  border-top: 2px dashed ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;

  /* No tamanho grande a diária vira uma faixa de aviso, como na placa de sinalização. */
  ${({ theme, $size }) =>
    $size === "lg" &&
    `
    padding: ${theme.space[2]}px ${theme.space[3]}px;
    border-top: 0;
    border-radius: ${theme.radii.md};
    background-color: ${theme.colors.warn};
    color: ${theme.colors.onWarn};
    font-size: ${theme.fontSizes.md};
  `}
`;

export const EmptyText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.85;
`;
