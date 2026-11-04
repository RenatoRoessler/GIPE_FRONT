"use client";

import styled from "styled-components";

// Cartão só de leitura: sem link, sem foco e sem hover.
export const Cartao = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  height: 100%;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

export const Linha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Placa = styled.b`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.03em;
  line-height: 1.2;
`;

export const Permanencia = styled.b`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

export const Veiculo = styled.span`
  min-width: 0;
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const Legenda = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  white-space: nowrap;
`;

export const Local = styled.span`
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  overflow-wrap: anywhere;
`;

export const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin-top: 2px;
  padding-top: ${({ theme }) => theme.space[2]}px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

export const Detalhe = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  overflow-wrap: anywhere;
`;

export const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;
