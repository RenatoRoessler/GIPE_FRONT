"use client";

import styled from "styled-components";

export const Wrapper = styled.label<{ $disabled: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

// O input nativo fica sobreposto e invisível: mantém teclado e leitor de tela sem reimplementar o papel.
export const NativeInput = styled.input`
  position: absolute;
  top: ${({ theme }) => theme.space[2]}px;
  left: 0;
  width: 20px;
  height: 20px;
  margin: 0;
  opacity: 0;
  cursor: inherit;
`;

export const Box = styled.span<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 1px solid
    ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $checked }) =>
    $checked ? theme.colors.primary : theme.colors.surface};
  color: ${({ theme }) => theme.colors.onPrimary};
  transition: background-color 0.15s ease, border-color 0.15s ease;

  ${NativeInput}:focus-visible + & {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    opacity: ${({ $checked }) => ($checked ? 1 : 0)};
  }
`;

export const TextGroup = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const LabelText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  user-select: none;
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.textMuted};
`;
