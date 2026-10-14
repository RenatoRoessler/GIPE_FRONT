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

export const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const Tile = styled.label<{ $checked: boolean; $disabled: boolean; $hasError: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid
    ${({ theme, $checked, $hasError }) =>
      $checked ? theme.colors.primary : $hasError ? theme.colors.danger : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $checked }) => ($checked ? theme.colors.primarySoft : theme.colors.background)};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $checked }) => ($checked ? theme.fontWeights.bold : theme.fontWeights.medium)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: ${({ theme, $disabled }) => ($disabled ? undefined : theme.colors.primary)};
  }

  &:focus-within {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

// Radio nativo escondido visualmente: continua focável e navegável por setas.
export const RadioInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// A seleção também é dita pela marca, não só pela cor.
export const Mark = styled.span<{ $checked: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.full};

  &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radii.full};
    background-color: ${({ theme }) => theme.colors.primary};
    transform: scale(${({ $checked }) => ($checked ? 1 : 0)});
    transition: transform 0.12s ease;
  }
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`;
