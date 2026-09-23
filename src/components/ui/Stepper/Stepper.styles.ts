"use client";

import styled, { css } from "styled-components";

export const List = styled.ol`
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
`;

export const Item = styled.li`
  display: flex;
  align-items: center;
  flex: 1;

  &:last-child {
    flex: 0 0 auto;
  }
`;

export const Dot = styled.span<{ $status: "done" | "current" | "pending" }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  ${({ $status, theme }) => {
    if ($status === "done") {
      return css`
        background-color: ${theme.colors.primary};
        color: white;
        border: 1px solid ${theme.colors.primary};
      `;
    }
    if ($status === "current") {
      return css`
        background-color: ${theme.colors.background};
        color: ${theme.colors.primary};
        border: 2px solid ${theme.colors.primary};
      `;
    }
    return css`
      background-color: ${theme.colors.background};
      color: ${theme.colors.textMuted};
      border: 1px solid ${theme.colors.border};
    `;
  }}
`;

export const Connector = styled.span<{ $filled: boolean }>`
  flex: 1;
  height: 2px;
  margin: 0 ${({ theme }) => theme.space[2]}px;
  background-color: ${({ theme, $filled }) =>
    $filled ? theme.colors.primary : theme.colors.border};
  transition: background-color 0.2s ease;
`;

export const StepLabel = styled.span<{ $status: "done" | "current" | "pending" }>`
  margin-left: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme, $status }) =>
    $status === "pending" ? theme.colors.textMuted : theme.colors.text};
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;
