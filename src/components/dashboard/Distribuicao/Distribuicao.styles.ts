"use client";

import styled from "styled-components";

export const Vazio = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[3]}px 0 ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Barra empilhada: um segmento por linha, com a largura proporcional ao valor e um respiro de 2px entre eles.
export const Barra = styled.div`
  display: flex;
  gap: 2px;
  height: 12px;
  margin: ${({ theme }) => theme.space[3]}px 0 ${({ theme }) => theme.space[2]}px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
`;

export const Segmento = styled.span<{ $peso: number; $cor: string }>`
  flex: ${({ $peso }) => $peso} 1 0;
  min-width: 2px;
  background-color: ${({ $cor }) => $cor};
`;

export const Linhas = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Linha = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Nome = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  color: ${({ theme }) => theme.colors.text};
`;

export const Marcador = styled.i<{ $cor: string }>`
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ $cor }) => $cor};
`;

export const Numeros = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const Valor = styled.b`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Participacao = styled.em`
  font-style: normal;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
