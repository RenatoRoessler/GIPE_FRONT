"use client";

import styled from "styled-components";

export type ChangeTone = "success" | "danger";

export const Box = styled.div<{ $tone: ChangeTone }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $tone }) => theme.colors[$tone]};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $tone }) => ($tone === "danger" ? theme.colors.dangerSoft : theme.colors.surface)};
`;

export const Label = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// O valor de sucesso usa `accent` quando o tema o pede como cor de texto; `success` marca a borda e o estado.
export const Amount = styled.strong<{ $tone: ChangeTone }>`
  color: ${({ theme, $tone }) => ($tone === "danger" ? theme.colors.text : theme.colors.success)};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

export const Received = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;
