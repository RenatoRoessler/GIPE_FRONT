"use client";

import styled from "styled-components";

export const Caixa = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: left;
`;

export const Titulo = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Texto = styled.p`
  margin: 0;
`;

export const Passos = styled.ol`
  margin: 0;
  padding-left: ${({ theme }) => theme.space[4]}px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;
