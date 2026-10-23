"use client";

import styled from "styled-components";

export const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
  max-width: 480px;
  margin: ${({ theme }) => theme.space[5]}px auto;
  padding: ${({ theme }) => theme.space[4]}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin: ${({ theme }) => theme.space[3]}px 0;

    & > button {
      width: 100%;
    }
  }
`;

export const Titulo = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`;
