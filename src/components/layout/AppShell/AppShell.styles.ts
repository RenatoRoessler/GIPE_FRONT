"use client";

import styled from "styled-components";

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[5]}px;
  }
`;
