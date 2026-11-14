"use client";

import styled from "styled-components";

export const Grupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Legenda = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Lista = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Chip = styled.button<{ $marcado: boolean }>`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $marcado }) => ($marcado ? theme.colors.accent : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $marcado }) => ($marcado ? theme.colors.accent : theme.colors.surface)};
  color: ${({ theme, $marcado }) => ($marcado ? theme.colors.onPrimary : theme.colors.text)};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
