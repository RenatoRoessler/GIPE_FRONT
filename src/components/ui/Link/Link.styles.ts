"use client";

import NextLink from "next/link";
import styled from "styled-components";

export const StyledLink = styled(NextLink)`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  width: fit-content;

  &:hover {
    text-decoration: underline;
  }
`;
