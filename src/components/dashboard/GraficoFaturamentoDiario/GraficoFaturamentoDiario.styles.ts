"use client";

import styled, { css } from "styled-components";
import type { DestaqueDoDia } from "../apresentacao";

export const Vazio = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[3]}px 0 ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Legenda = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ItemLegenda = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Marcador = styled.i<{ $cor: string }>`
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ $cor }) => $cor};
`;

// Reserva a altura de duas linhas para o detalhe não empurrar o gráfico quando o dia selecionado muda.
export const Detalhe = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 2.6em;
  margin-top: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DetalheTitulo = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
`;

export const Area = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 170px;
  margin-top: ${({ theme }) => theme.space[2]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 2px;
    height: 130px;
  }
`;

// Cada dia é um botão da altura toda do gráfico: a área de toque é a coluna inteira, não só a barra desenhada.
export const Coluna = styled.button<{ $destaque: DestaqueDoDia; $ativa: boolean }>`
  display: flex;
  flex: 1;
  align-items: flex-end;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $ativa }) => ($ativa ? theme.colors.surfaceMuted : "transparent")};
  cursor: pointer;
  opacity: ${({ $destaque }) => ($destaque === "esmaecido" ? 0.35 : 1)};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.15s ease;
  }
`;

export const Barra = styled.span<{ $altura: number; $destaque: DestaqueDoDia; $semValor: boolean }>`
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  height: ${({ $altura }) => $altura}%;
  min-height: 2px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $semValor }) => ($semValor ? theme.colors.border : "transparent")};

  ${({ $destaque, theme }) =>
    $destaque === "selecionado" &&
    css`
      outline: 2px solid ${theme.colors.focus};
      outline-offset: 2px;
    `}
`;

export const Segmento = styled.span<{ $valor: number; $cor: string }>`
  display: block;
  flex: ${({ $valor }) => $valor} 1 0;
  background-color: ${({ $cor }) => $cor};
`;

// Dia antes do início do uso: tracejado e sem preenchimento, para não parecer um dia sem faturamento.
export const Lacuna = styled.span`
  flex: 1;
  min-width: 0;
  height: 100%;
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
