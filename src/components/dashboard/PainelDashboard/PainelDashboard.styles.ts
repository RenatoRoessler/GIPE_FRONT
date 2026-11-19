"use client";

import styled from "styled-components";

// Superfície de cada bloco da Visão Geral. `min-width: 0` deixa a grade encolher o painel em vez de estourar a largura da tela.
export const Painel = styled.section`
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Cabecalho = styled.div<{ $acessorioAoLado: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: ${({ $acessorioAoLado }) => ($acessorioAoLado ? "flex-start" : "space-between")};
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
`;

export const Rotulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
`;
