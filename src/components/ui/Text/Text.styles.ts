"use client";

import styled, { css } from "styled-components";

export type TextVariant = "heading" | "body" | "muted" | "error";

export const StyledText = styled.p<{ $variant: TextVariant }>`
  margin: 0;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case "heading":
        return css`
          font-size: ${theme.fontSizes.xl};
          font-weight: ${theme.fontWeights.bold};
          color: ${theme.colors.text};
          letter-spacing: -0.01em;
        `;
      case "muted":
        return css`
          font-size: ${theme.fontSizes.sm};
          font-weight: ${theme.fontWeights.regular};
          color: ${theme.colors.textMuted};
        `;
      case "error":
        return css`
          font-size: ${theme.fontSizes.sm};
          font-weight: ${theme.fontWeights.medium};
          color: ${theme.colors.danger};
        `;
      default:
        return css`
          font-size: ${theme.fontSizes.md};
          font-weight: ${theme.fontWeights.regular};
          color: ${theme.colors.text};
        `;
    }
  }}
`;
