"use client";

import styled from "styled-components";

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[4]}px;
  align-items: start;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 3fr 2fr;
  }
`;

export const RowFields = styled.div<{ $withPercent: boolean }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: ${({ $withPercent }) => ($withPercent ? "1fr 1fr 1fr" : "1fr 1fr")};
  }
`;

export const RowFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;
