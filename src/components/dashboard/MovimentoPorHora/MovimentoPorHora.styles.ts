"use client";

import styled from "styled-components";

export const Vazio = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[3]}px 0 ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Area = styled.div`
  display: flex;
  align-items: stretch;
  gap: 3px;
  height: 120px;
  margin-top: ${({ theme }) => theme.space[3]}px;
`;

// Uma coluna por hora (ou por duas horas): o valor em cima e a barra embaixo. Cada uma é um botão da altura toda.
export const Coluna = styled.button`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const Valor = styled.small<{ $ativa: boolean }>`
  display: block;
  margin-bottom: 3px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: ${({ theme, $ativa }) => ($ativa ? theme.colors.text : theme.colors.textMuted)};
`;

// A faixa de maior movimento usa o amarelo da marca como preenchimento (com a borda um tom abaixo: `primary` só preenche); as demais,
// o tom neutro. A selecionada ganha contorno.
export const Barra = styled.i<{ $altura: number; $pico: boolean; $ativa: boolean }>`
  display: block;
  height: ${({ $altura }) => $altura}%;
  border: 1px solid ${({ theme, $pico }) => ($pico ? theme.colors.primaryHover : theme.colors.border)};
  border-radius: ${({ theme }) => `${theme.radii.sm} ${theme.radii.sm} 2px 2px`};
  background-color: ${({ theme, $pico }) => ($pico ? theme.colors.primary : theme.colors.surfaceMuted)};
  outline: ${({ theme, $ativa }) => ($ativa ? `2px solid ${theme.colors.text}` : "none")};
  outline-offset: 1px;
`;

// Hora que ainda não chegou: coluna tracejada e vazia.
export const Futura = styled.span`
  display: block;
  flex: 1;
  min-width: 0;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const Eixo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Detalhe = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: ${({ theme }) => theme.space[3]}px 0 ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DetalheTitulo = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Faixas = styled.ul`
  margin: ${({ theme }) => theme.space[2]}px 0 0;
  padding: 0;
  list-style: none;
`;

export const Faixa = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[1]}px 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

export const FaixaNumeros = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const FaixaHoras = styled.b`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const FaixaMedia = styled.em`
  font-style: normal;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
