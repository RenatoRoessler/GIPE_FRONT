"use client";

import styled from "styled-components";

export const Lista = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: max-content minmax(0, 1fr);
    column-gap: ${({ theme }) => theme.space[4]}px;
    row-gap: ${({ theme }) => theme.space[2]}px;
  }
`;

export const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;
