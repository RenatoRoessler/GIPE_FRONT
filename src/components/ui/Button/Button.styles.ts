"use client";

import styled, { css } from "styled-components";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md";

export const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.15s ease;

  ${({ $size, theme }) =>
    $size === "sm"
      ? css`
          padding: ${theme.space[1]}px ${theme.space[3]}px;
          font-size: ${theme.fontSizes.sm};
        `
      : css`
          padding: ${theme.space[2]}px ${theme.space[4]}px;
          font-size: ${theme.fontSizes.md};
        `}

  ${({ $variant, theme }) => {
    switch ($variant) {
      case "secondary":
        return css`
          background-color: ${theme.colors.surface};
          color: ${theme.colors.text};

          &:hover {
            background-color: ${theme.colors.border};
          }
        `;
      case "danger":
        return css`
          background-color: ${theme.colors.danger};
          color: white;

          &:hover {
            opacity: 0.9;
          }
        `;
      default:
        return css`
          background-color: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};

          &:hover {
            background-color: ${theme.colors.primaryHover};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
