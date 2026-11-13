"use client";

import styled from "styled-components";

export const Item = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[2]}px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: 0;
  }
`;

export const Texto = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
`;

export const Nome = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  overflow-wrap: anywhere;
`;

export const Valor = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
`;

export const Direita = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Icone = styled.span`
  display: inline-flex;
  margin-right: ${({ theme }) => theme.space[1]}px;
`;

export const Acoes = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.layout.touchTarget};
  height: ${({ theme }) => theme.layout.touchTarget};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
