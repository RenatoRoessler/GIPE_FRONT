"use client";

import styled from "styled-components";

export const Vazio = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[3]}px 0 ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Linhas = styled.ul`
  margin: ${({ theme }) => theme.space[2]}px 0 0;
  padding: 0;
  list-style: none;
`;

// Nome | trilho | quantidade e valor. O nome encolhe com reticências em vez de empurrar os números para fora da tela.
export const Linha = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 110px) minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[1]}px 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Nome = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text};
`;

export const Trilho = styled.span`
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;

export const Preenchimento = styled.span<{ $proporcao: number }>`
  display: block;
  width: ${({ $proporcao }) => Math.max(0, Math.min(1, $proporcao)) * 100}%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const Numeros = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 120px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-width: 0;
  }
`;

export const Quantidade = styled.b`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Valor = styled.em`
  font-style: normal;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Rodape = styled.p`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  margin: ${({ theme }) => theme.space[2]}px 0 0;
  padding-top: ${({ theme }) => theme.space[2]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
