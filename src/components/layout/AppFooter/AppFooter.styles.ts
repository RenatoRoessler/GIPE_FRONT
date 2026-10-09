"use client";

import styled from "styled-components";

export const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  a {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[5]}px;
  }
`;
