"use client";

import styled from "styled-components";

export const Atalhos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Chip de atalho: ativo preenche com a cor de destaque; o estado também é dito por `aria-pressed`.
export const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1.5px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.accent};
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
