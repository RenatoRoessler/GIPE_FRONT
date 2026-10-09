"use client";

import styled, { css } from "styled-components";

export type TextVariant = "heading" | "body" | "muted" | "error";

export const StyledText = styled.p<{ $variant: TextVariant }>`
  margin: 0;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case "heading":
        return css`
          font-family: ${theme.typography.display};
          font-size: ${theme.typography.displaySize};
          font-weight: ${theme.fontWeights.bold};
          color: ${theme.colors.text};
          letter-spacing: ${theme.typography.displayTracking === "normal" ? "-0.01em" : theme.typography.displayTracking};
          text-transform: ${theme.typography.displayTransform};
          line-height: 1.1;
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
