"use client";

import styled, { css } from "styled-components";

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  width: 100%;
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const StyledInput = styled.input<{ $hasError: boolean }>`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.danger : theme.colors.primary};
    box-shadow: 0 0 0 3px
      ${({ $hasError }) =>
        $hasError ? "rgba(229, 72, 77, 0.15)" : "rgba(51, 102, 255, 0.15)"};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    opacity: 0.8;
  }

  ${({ $hasError }) =>
    $hasError &&
    css`
      &:not(:focus) {
        background-color: rgba(229, 72, 77, 0.04);
      }
    `}
`;

export type HintTone = "muted" | "success" | "danger";

export const HintText = styled.span<{ $tone: HintTone }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $tone }) =>
    $tone === "muted" ? theme.colors.textMuted : theme.colors[$tone]};
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`;
