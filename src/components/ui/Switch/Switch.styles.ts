"use client";

import styled from "styled-components";

export const Wrapper = styled.label<{ $disabled: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 44px;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

export const Track = styled.button<{ $checked: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 24px;
  padding: 0;
  border: 1px solid
    ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $checked }) =>
    $checked ? theme.colors.primary : theme.colors.surface};
  cursor: inherit;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Thumb = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $checked }) => ($checked ? "18px" : "2px")};
  width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $checked }) =>
    $checked ? theme.colors.onPrimary : theme.colors.textMuted};
  transition: left 0.15s ease;
`;

export const LabelText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  user-select: none;
`;
