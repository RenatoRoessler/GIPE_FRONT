"use client";

import styled from "styled-components";

export const Total = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-variant-numeric: tabular-nums;
  }
`;
