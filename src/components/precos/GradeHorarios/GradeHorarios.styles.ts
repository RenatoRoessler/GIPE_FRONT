"use client";

import styled from "styled-components";

export const Raiz = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
`;

export const Atalhos = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const AtalhosRotulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
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
