"use client";

import styled, { css } from "styled-components";

export type StatusBadgeTone = "success" | "neutral" | "info" | "warn";

export const StyledStatusBadge = styled.span<{ $tone: StatusBadgeTone }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;

  ${({ $tone, theme }) => {
    switch ($tone) {
      case "success":
        return css`
          background-color: ${theme.colors.surface};
          color: ${theme.colors.success};
          box-shadow: inset 0 0 0 1px ${theme.colors.success};
        `;
      case "info":
        return css`
          background-color: ${theme.colors.primarySoft};
          color: ${theme.colors.link};
        `;
      case "warn":
        return css`
          background-color: ${theme.colors.warn};
          color: ${theme.colors.onWarn};
        `;
      default:
        return css`
          background-color: ${theme.colors.surface};
          color: ${theme.colors.textMuted};
          box-shadow: inset 0 0 0 1px ${theme.colors.border};
        `;
    }
  }}
`;
