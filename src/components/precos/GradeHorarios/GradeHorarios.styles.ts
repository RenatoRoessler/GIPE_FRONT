"use client";

import styled from "styled-components";

export const Raiz = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
`;

export const AtalhosRotulo = styled.span`
  display: block;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Quatro modelos de mesmo tamanho, em grade: o nome em destaque e o horário embaixo.
export const Atalhos = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export const Atalho = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 56px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &[aria-pressed="true"] {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primarySoft};
    padding: calc(${({ theme }) => theme.space[2]}px - 1px) calc(${({ theme }) => theme.space[3]}px - 1px);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const AtalhoTitulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const AtalhoDetalhe = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.3;
`;

export const Ferramentas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// A grade rola na horizontal dentro do próprio contêiner em telas estreitas.
export const Rolagem = styled.div`
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.space[1]}px;
`;

export const Tabela = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 640px;
  user-select: none;
`;

export const Linha = styled.div`
  display: grid;
  grid-template-columns: 48px repeat(24, minmax(0, 1fr));
  gap: 2px;
  align-items: center;
`;

export const BotaoEixo = styled.button`
  min-height: 28px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

export const BotaoHora = styled(BotaoEixo)`
  min-height: 22px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-variant-numeric: tabular-nums;
  text-align: center;
`;

export const Celula = styled.button`
  height: 28px;
  min-width: 0;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;

  &[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary};
  }

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.text};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const Legenda = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Amostra = styled.i<{ $ligada: boolean }>`
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: ${({ theme }) => theme.space[1]}px;
  vertical-align: -2px;
  border: 1px solid ${({ theme, $ligada }) => ($ligada ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $ligada }) => ($ligada ? theme.colors.primary : theme.colors.surface)};
`;

export const Resumo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const ResumoTitulo = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;
