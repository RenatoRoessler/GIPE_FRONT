"use client";

import styled, { css, keyframes } from "styled-components";

export type ToastVariant = "success" | "error";

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -12px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

export const ToastWrapper = styled.div<{ $variant: ToastVariant }>`
  position: fixed;
  top: ${({ theme }) => theme.space[4]}px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  color: white;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  width: calc(100vw - ${({ theme }) => theme.space[4] * 2}px);
  animation: ${slideIn} 0.2s ease;

  ${({ $variant, theme }) =>
    $variant === "success"
      ? css`
          background-color: ${theme.colors.success};
        `
      : css`
          background-color: ${theme.colors.danger};
        `}

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: max-content;
    max-width: 360px;
  }
`;
