"use client";

import styled, { css } from "styled-components";

export type SentidoVariacao = "alta" | "queda";

// Pílula (com fundo suave) no faturamento; em texto simples (sem fundo) na linha do mês.
export const Raiz = styled.span<{ $sentido: SentidoVariacao; $pilula: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $sentido }) => ($sentido === "alta" ? theme.colors.success : theme.colors.danger)};

  ${({ $pilula, $sentido, theme }) =>
    $pilula &&
    css`
      padding: ${theme.space[1]}px ${theme.space[2]}px;
      border-radius: ${theme.radii.full};
      background-color: ${$sentido === "alta" ? theme.colors.successSoft : theme.colors.dangerSoft};
    `}
`;
