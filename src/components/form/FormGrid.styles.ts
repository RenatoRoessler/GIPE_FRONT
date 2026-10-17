"use client";

import styled from "styled-components";

export const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
`;

export const GridItem = styled.div<{ $span?: boolean }>`
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-column: ${({ $span }) => ($span ? "1 / -1" : "auto")};
  }
`;
