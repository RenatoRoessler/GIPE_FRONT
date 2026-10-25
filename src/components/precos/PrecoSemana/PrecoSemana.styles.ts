"use client";

import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Mesmas colunas da régua e das linhas; no celular o texto desce para baixo do nome do dia.
const COLUNAS_LARGAS = "56px minmax(0, 1fr) 150px";
const COLUNAS_ESTREITAS = "56px minmax(0, 1fr)";

export const Regua = styled.div`
  display: grid;
  grid-template-columns: ${COLUNAS_ESTREITAS};
  gap: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: ${COLUNAS_LARGAS};
  }
`;

export const Marcas = styled.div`
  grid-column: 2;
  display: flex;
  justify-content: space-between;
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Linha = styled.li<{ $inativa: boolean }>`
  display: grid;
  grid-template-columns: ${COLUNAS_ESTREITAS};
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: ${({ $inativa }) => ($inativa ? 0.6 : 1)};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: ${COLUNAS_LARGAS};
  }
`;

export const Dia = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Trilho = styled.div`
  position: relative;
  height: 14px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Segmento = styled.span<{ $de: number; $ate: number; $inativo: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $de }) => $de * 100}%;
  width: ${({ $de, $ate }) => Math.max($ate - $de, 0.01) * 100}%;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.accent};
  opacity: ${({ $inativo }) => ($inativo ? 0.5 : 1)};
`;

export const Detalhe = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  grid-column: 2;
  font-variant-numeric: tabular-nums;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-column: auto;
    text-align: right;
  }
`;

export const Texto = styled.span<{ $semCobranca: boolean }>`
  color: ${({ theme, $semCobranca }) => ($semCobranca ? theme.colors.textMuted : theme.colors.text)};
`;

export const Observacao = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Nome completo do dia só para leitores de tela (o texto visível é abreviado).
export const Oculto = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
