"use client";

import styled from "styled-components";

export type ModalSize = "sm" | "lg";

const WIDTHS: Record<ModalSize, string> = { sm: "480px", lg: "760px" };

export const Dialog = styled.dialog<{ $size: ModalSize }>`
  width: calc(100% - ${({ theme }) => theme.space[3] * 2}px);
  max-width: ${({ $size }) => WIDTHS[$size]};
  max-height: calc(100dvh - ${({ theme }) => theme.space[4] * 2}px);
  margin: auto;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;

  &[open] {
    display: flex;
    flex-direction: column;
  }

  &::backdrop {
    background-color: rgba(20, 32, 46, 0.6);
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  overflow-y: auto;
`;

export const Footer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;
