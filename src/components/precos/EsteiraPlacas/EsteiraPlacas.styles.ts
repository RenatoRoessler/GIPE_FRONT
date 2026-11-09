"use client";

import styled from "styled-components";

// Esteira: as miniplacas rolam para o lado com encaixe; a próxima fica parcialmente à vista como pista de que há mais.
export const Trilho = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0 -${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding: 0 ${({ theme }) => theme.space[3]}px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin: 0;
    padding-inline: 0;
  }
`;

export const Posicao = styled.li`
  flex: 0 0 ${({ theme }) => theme.layout.placaMiniWidth};
  scroll-snap-align: start;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-basis: calc(${({ theme }) => theme.layout.placaMiniWidth} + ${({ theme }) => theme.space[4]}px);
  }
`;

export const Placa = styled.button<{ $selecionada: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  height: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[2]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: inset 0 0 0 ${({ $selecionada }) => ($selecionada ? 2 : 1)}px
    ${({ theme, $selecionada }) => ($selecionada ? theme.colors.accent : theme.colors.border)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.borderStrong};
  }

  &[aria-current="true"]:hover {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Nome = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Tipo e situação na mesma linha; em tela estreita o gap curto evita quebrar o selo para outra linha.
export const MetaMini = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  white-space: nowrap;
`;

export const Degraus = styled.span`
  display: flex;
  gap: ${({ theme }) => theme.space[1]}px;
  margin-top: auto;
  font-variant-numeric: tabular-nums;
`;

export const Degrau = styled.span<{ $diaria?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.space[1]}px 2px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $diaria }) => ($diaria ? theme.colors.warn : theme.colors.surfaceMuted)};
  color: ${({ theme, $diaria }) => ($diaria ? theme.colors.onWarn : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.2;
  white-space: nowrap;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
`;

export const SemValores = styled.span`
  margin-top: auto;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
