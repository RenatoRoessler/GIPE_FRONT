"use client";

import styled, { css } from "styled-components";

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  width: 100%;
`;

export const Label = styled.label<{ $hidden: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};

  /* Oculto só para quem vê: o rótulo continua ligado ao campo para leitores de tela. */
  ${({ $hidden }) =>
    $hidden &&
    css`
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    `}
`;

export const SelectWrapper = styled.div`
  position: relative;
  display: flex;
`;

export const StyledSelect = styled.select<{ $hasError: boolean }>`
  width: 100%;
  appearance: none;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[6]}px
    ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.md};
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.danger : theme.colors.accent};
    box-shadow: 0 0 0 3px
      ${({ theme, $hasError }) => ($hasError ? theme.colors.dangerSoft : theme.colors.primarySoft)};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

export const Chevron = styled.svg`
  position: absolute;
  right: ${({ theme }) => theme.space[3]}px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  pointer-events: none;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`;
