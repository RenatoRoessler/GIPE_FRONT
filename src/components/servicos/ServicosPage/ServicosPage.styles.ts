"use client";

import styled from "styled-components";

export const Tela = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  min-width: 0;
`;

export const Titulo = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  line-height: 1.1;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.displaySize};
  }
`;

export const Esqueleto = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;
