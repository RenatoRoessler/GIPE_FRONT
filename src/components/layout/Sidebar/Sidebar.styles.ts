"use client";

import styled, { css } from "styled-components";

const COLLAPSED_WIDTH = "76px";
const EXPANDED_WIDTH = "260px";
const HEADER_HEIGHT = "64px";

export const Overlay = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? "block" : "none")};
  position: fixed;
  inset: 0;
  background-color: rgba(17, 19, 24, 0.4);
  z-index: 20;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

export const Nav = styled.nav<{ $isOpen: boolean; $expanded: boolean }>`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  width: 76%;
  max-width: ${EXPANDED_WIDTH};
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  transform: translateX(-100%);
  transition: transform 0.2s ease, background-color 0.15s ease, border-color 0.15s ease;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      transform: translateX(0);
    `}

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    max-width: none;
    transform: none;
    height: 100vh;
    width: ${({ $expanded }) => ($expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH)};
    transition: width 0.2s ease;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  height: ${HEADER_HEIGHT};
  flex-shrink: 0;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const BrandDot = styled.span`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 50%,
    ${({ theme }) => theme.colors.danger} 50%
  );
`;

export const BrandName = styled.span<{ $expanded: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: -0.01em;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.15s ease;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
  }
`;

export const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
`;

export const NavItemLink = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background-color: ${theme.colors.primary};
      color: ${theme.colors.onPrimary};

      &:hover {
        background-color: ${theme.colors.primary};
      }
    `}
`;

export const NavLabel = styled.span<{ $expanded: boolean }>`
  opacity: 1;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
    transition: opacity 0.15s ease;
  }
`;
