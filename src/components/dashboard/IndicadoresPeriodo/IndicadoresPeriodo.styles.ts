"use client";

import styled from "styled-components";

export const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[3]}px;

  /* No celular são duas colunas e o terceiro indicador ocupa a linha inteira. */
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    & > :last-child {
      grid-column: span 2;
    }
  }
`;

export const Valor = styled.p<{ $semValor: boolean }>`
  margin: ${({ theme }) => theme.space[2]}px 0 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $semValor }) => ($semValor ? theme.colors.textMuted : theme.colors.text)};
`;

export const Subtexto = styled.p`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
