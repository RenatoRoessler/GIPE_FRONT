"use client";

import styled from "styled-components";

export const TabList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
`;

export const Tab = styled.button<{ $active: boolean }>`
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
`;

export const Panel = styled.div`
  padding-top: ${({ theme }) => theme.space[4]}px;
`;
