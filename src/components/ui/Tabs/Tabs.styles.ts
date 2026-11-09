"use client";

import styled, { css } from "styled-components";

export type TabsVariant = "linha" | "segmentada";

export const TabList = styled.div<{ $variant: TabsVariant }>`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;

  ${({ $variant, theme }) =>
    $variant === "segmentada" &&
    css`
      gap: 2px;
      padding: 3px;
      border-bottom: none;
      border-radius: ${theme.radii.md};
      background-color: ${theme.colors.surfaceMuted};
    `}
`;

export const Tab = styled.button<{ $active: boolean; $variant: TabsVariant }>`
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid ${({ theme, $active }) => ($active ? theme.colors.accent : "transparent")};
  background-color: transparent;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme, $active }) => ($active ? theme.fontWeights.bold : theme.fontWeights.medium)};
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -3px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  ${({ $variant, $active, theme }) =>
    $variant === "segmentada" &&
    css`
      flex: 1;
      justify-content: center;
      margin-bottom: 0;
      border-bottom: none;
      border-radius: ${theme.radii.sm};
      font-size: ${theme.fontSizes.sm};
      background-color: ${$active ? theme.colors.surface : "transparent"};
      box-shadow: ${$active ? theme.shadows.sm : "none"};
    `}
`;

export const Panel = styled.div`
  padding-top: ${({ theme }) => theme.space[4]}px;
`;
