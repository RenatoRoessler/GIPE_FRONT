"use client";

import styled from "styled-components";

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const GridItem = styled.div<{ $span?: boolean }>`
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-column: ${({ $span }) => ($span ? "1 / -1" : "auto")};
  }
`;
