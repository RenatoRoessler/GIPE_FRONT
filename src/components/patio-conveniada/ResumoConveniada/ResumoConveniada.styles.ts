"use client";

import styled from "styled-components";

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const Total = styled.p`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  b {
    color: ${({ theme }) => theme.colors.accent};
    font-size: ${({ theme }) => theme.fontSizes.xxl};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    letter-spacing: -0.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
`;

// Rola na horizontal dentro do bloco, nunca a página.
export const Chips = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-bottom: ${({ theme }) => theme.space[1]}px;
  overflow-x: auto;
`;

export const Chip = styled.button`
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  strong {
    color: ${({ theme }) => theme.colors.link};
    font-variant-numeric: tabular-nums;
  }

  &[aria-pressed="true"] {
    background-color: ${({ theme }) => theme.colors.primarySoft};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: background-color 0.15s ease;
  }
`;
