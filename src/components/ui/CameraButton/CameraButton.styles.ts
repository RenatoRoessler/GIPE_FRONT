"use client";

import styled from "styled-components";

export type CameraButtonSize = "sm" | "md";

const SIZE: Record<CameraButtonSize, number> = { sm: 32, md: 40 };

export const StyledCameraButton = styled.button<{ $size: CameraButtonSize }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size }) => SIZE[$size]}px;
  height: ${({ $size }) => SIZE[$size]}px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
