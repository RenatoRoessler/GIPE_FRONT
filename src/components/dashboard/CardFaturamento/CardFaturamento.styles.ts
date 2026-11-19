"use client";

import styled from "styled-components";
import type { TomIndicador } from "../apresentacao";

export const Valor = styled.p`
  margin: ${({ theme }) => theme.space[2]}px 0 ${({ theme }) => theme.space[2]}px;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  color: ${({ theme }) => theme.colors.accent};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`;

// As duas colunas do mês, separadas do número do período por um divisor.
export const Indicadores = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: ${({ theme }) => theme.space[3]}px 0 0;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Indicador = styled.div`
  min-width: 0;
`;

export const IndicadorRotulo = styled.dt`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Número em destaque; quando é uma mensagem de espera ("Disponível com 5 dias de uso") fica menor e esmaecido.
export const IndicadorValor = styled.dd<{ $espera: boolean }>`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  font-size: ${({ theme, $espera }) => ($espera ? theme.fontSizes.sm : theme.fontSizes.lg)};
  font-weight: ${({ theme, $espera }) => ($espera ? theme.fontWeights.medium : theme.fontWeights.bold)};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $espera }) => ($espera ? theme.colors.textMuted : theme.colors.text)};
`;

export const IndicadorSubtexto = styled.dd<{ $tom: TomIndicador }>`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $tom }) => ($tom === "alta" ? theme.colors.success : $tom === "queda" ? theme.colors.danger : theme.colors.textMuted)};
`;

export const BoasVindas = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-top: ${({ theme }) => theme.space[2]}px;
`;

export const BoasVindasIcone = styled.span`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.accent};
`;

export const BoasVindasTitulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

export const BoasVindasTexto = styled.p`
  max-width: 42ch;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`;
