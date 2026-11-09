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
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &[aria-pressed="true"] {
    border: 2px solid ${({ theme }) => theme.colors.accent};
    background-color: ${({ theme }) => theme.colors.primarySoft};
    padding: calc(${({ theme }) => theme.space[2]}px - 1px) calc(${({ theme }) => theme.space[3]}px - 1px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
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

// A grade cabe na largura do celular: horas nas linhas e dias nas colunas (7 colunas). A partir de md ela se
// deita: dias nas linhas e as 24 horas nas colunas, rolando na horizontal dentro do contêiner se não couber.
export const Rolagem = styled.div`
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.space[1]}px;
`;

// Cada botão guarda o seu dia (--d, 0 a 6, de segunda a domingo) e a sua hora (--h, 0 a 23) em variáveis CSS;
// a posição na grade sai delas e muda de eixo conforme a largura, sem repetir a marcação.
export const Tabela = styled.div`
  display: grid;
  grid-template-columns: 40px repeat(7, minmax(0, 1fr));
  gap: 2px;
  user-select: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 48px repeat(24, minmax(0, 1fr));
    gap: 2px;
    min-width: 640px;
  }
`;

export const Canto = styled.span`
  grid-column: 1;
  grid-row: 1;
`;

export const BotaoEixo = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 2px;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: center;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

// Nome do dia: cabeçalho de coluna no celular, rótulo de linha a partir de md.
export const BotaoDia = styled(BotaoEixo)`
  grid-column: calc(var(--d) + 2);
  grid-row: 1;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: 1;
    grid-row: calc(var(--d) + 2);
    min-height: 28px;
    text-align: left;
  }
`;

// Hora: rótulo de linha no celular, cabeçalho de coluna a partir de md.
export const BotaoHora = styled(BotaoEixo)`
  grid-column: 1;
  grid-row: calc(var(--h) + 2);
  min-height: 32px;
  padding-right: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  font-variant-numeric: tabular-nums;
  text-align: right;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: calc(var(--h) + 2);
    grid-row: 1;
    min-height: 22px;
    padding-right: 2px;
    text-align: center;
  }
`;

export const Celula = styled.button`
  grid-column: calc(var(--d) + 2);
  grid-row: calc(var(--h) + 2);
  height: 32px;
  min-width: 0;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: calc(var(--h) + 2);
    grid-row: calc(var(--d) + 2);
    height: 28px;
  }

  &[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.accent};
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
  border: 1px solid ${({ theme, $ligada }) => ($ligada ? theme.colors.accent : theme.colors.border)};
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

// Faixa rápida: dias em chips, intervalo De/Até e o botão de aplicar, entre os modelos e a grade.
export const FaixaBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const FaixaTitulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ChipsDias = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const ChipDia = styled.button`
  min-width: ${({ theme }) => theme.layout.touchTarget};
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.accent};
    background-color: ${({ theme }) => theme.colors.primarySoft};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const CamposHora = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  align-items: end;
  gap: ${({ theme }) => theme.space[2]}px;
`;
