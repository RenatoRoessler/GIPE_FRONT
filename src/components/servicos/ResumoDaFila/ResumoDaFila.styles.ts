"use client";

import styled from "styled-components";

export const Lista = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Chip = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`;

export const Atrasados = styled(Chip)`
  border-color: ${({ theme }) => theme.colors.danger};
  background-color: ${({ theme }) => theme.colors.dangerSoft};
`;

export const Ponto = styled.span<{ $tom: "neutro" | "andamento" | "pronto" }>`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background-color: ${({ theme, $tom }) => ($tom === "pronto" ? theme.colors.success : $tom === "andamento" ? theme.colors.warn : theme.colors.textMuted)};
`;
