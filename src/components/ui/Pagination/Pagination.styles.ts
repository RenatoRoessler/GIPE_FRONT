"use client";

import styled from "styled-components";

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  flex-wrap: wrap;
  padding-top: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;

  /* Em telas de toque os botões têm o alvo mínimo de 44 px. */
  @media (pointer: coarse) {
    & > button {
      min-height: ${({ theme }) => theme.layout.touchTarget};
    }
  }
`;

export const PageIndicator = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;
