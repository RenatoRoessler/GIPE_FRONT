"use client";

import styled, { css } from "styled-components";

// Lista no fluxo, logo abaixo do campo: não é cortada pelo corpo rolável do modal nem fica atrás do <dialog>.
export const Listbox = styled.ul`
  max-height: 240px;
  margin: 0;
  padding: ${({ theme }) => theme.space[1]}px;
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const Option = styled.li<{ $active: boolean; $selected: boolean }>`
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;

  ${({ $selected, theme }) =>
    $selected &&
    css`
      font-weight: ${theme.fontWeights.semibold};
    `}

  ${({ $active, theme }) =>
    $active &&
    css`
      background-color: ${theme.colors.primarySofter};
    `}

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySofter};
  }
`;

export const Match = styled.strong`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Message = styled.div`
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
