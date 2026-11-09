"use client";

import styled from "styled-components";

export const Resumo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

export const Rotulo = styled.span`
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Valor = styled.span`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-variant-numeric: tabular-nums;
`;

export const SemValor = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;
