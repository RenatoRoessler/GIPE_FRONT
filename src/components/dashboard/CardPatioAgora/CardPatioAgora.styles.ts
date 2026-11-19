"use client";

import styled from "styled-components";

export const Total = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: ${({ theme }) => theme.space[2]}px 0 ${({ theme }) => theme.space[2]}px;
`;

export const Numero = styled.span`
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.text};
`;

export const Complemento = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Barra = styled.div`
  margin-top: ${({ theme }) => theme.space[3]}px;
`;

export const Linha = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-top: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
`;
