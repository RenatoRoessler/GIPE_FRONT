"use client";

import styled from "styled-components";

export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
`;

export const Legend = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Rádio nativo escondido: setas, foco e leitor de tela vêm do navegador.
export const RadioInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
`;

export const Chip = styled.label<{ $checked: boolean; $disabled: boolean }>`
  position: relative;
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-width: ${({ theme }) => theme.layout.touchTarget};
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $checked }) => ($checked ? theme.colors.accent : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $checked }) => ($checked ? theme.colors.primarySoft : theme.colors.background)};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $checked }) => ($checked ? theme.fontWeights.bold : theme.fontWeights.medium)};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:has(input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
