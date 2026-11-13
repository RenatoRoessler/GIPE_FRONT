"use client";

import styled from "styled-components";

export const Cabecalho = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Placa = styled.b`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Mensagem = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Resumo = styled.p`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Total = styled.b`
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;
