"use client";

import styled from "styled-components";

export const Resumo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Valor = styled.b`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

export const Remover = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  align-self: flex-start;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.danger};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Explicacao = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
