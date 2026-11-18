"use client";

import styled, { css } from "styled-components";
import type { EstadoSecao } from "./PainelCadastro";

// Formulário à esquerda e painel à direita em telas grandes; abaixo disso, uma coluna só, com o painel fixo
// acima do menu inferior. O fim do formulário reserva a altura da barra (`--painel-cadastro-altura`, publicada
// pelo painel), menos a sobra do botão de Entrada, que a página já reserva junto com o menu.
export const Corpo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding-bottom: calc(var(--painel-cadastro-altura, 0px) - ${({ theme }) => theme.layout.bottomNavOverhang});

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding-bottom: 0;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      ${({ theme }) => theme.layout.formAsideWidth};
    align-items: start;
  }
`;

// Celular e tablet: barra de ações fixa na base, de ponta a ponta, encostada no menu inferior. O botão de Entrada
// sobressai sobre a folga de baixo da barra (o menu fica por cima), nunca sobre os botões.
// Telas grandes: painel lateral fixo abaixo do cabeçalho.
export const Painel = styled.aside`
  position: fixed;
  right: 0;
  bottom: calc(${({ theme }) => theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px));
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  padding-bottom: calc(${({ theme }) => theme.space[3]}px + ${({ theme }) => theme.layout.bottomNavOverhang});
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: ${({ theme }) => theme.layout.stickyTop};
    right: auto;
    bottom: auto;
    left: auto;
    gap: ${({ theme }) => theme.space[4]}px;
    padding: ${({ theme }) => theme.space[4]}px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.lg};
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

export const Progresso = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${({ theme }) => theme.space[2]}px;
  }
`;

export const Status = styled.p`
  flex-shrink: 0;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

const corDoEstado = (estado: EstadoSecao) => css`
  background-color: ${({ theme }) =>
    estado === "pronta" ? theme.colors.success : estado === "erro" ? theme.colors.danger : theme.colors.surfaceMuted};
`;

// Um segmento por seção, na cor do estado dela: o mesmo resumo da lista, em uma linha.
export const Trilho = styled.div`
  flex: 1;
  display: flex;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
`;

export const Segmento = styled.span<{ $estado: EstadoSecao }>`
  flex: 1;
  height: 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  ${({ $estado }) => corDoEstado($estado)}

  @media (prefers-reduced-motion: no-preference) {
    transition: background-color 0.2s ease-out;
  }
`;

// A lista de seções só aparece no painel lateral; na barra do celular o trilho já resume o estado.
export const Navegacao = styled.nav`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
    padding-top: ${({ theme }) => theme.space[3]}px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const Lista = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ItemBotao = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[2]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -2px;
  }
`;

export const Marca = styled.span<{ $estado: EstadoSecao }>`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radii.full};

  ${({ $estado, theme }) =>
    $estado === "pendente"
      ? css`
          border: 1.5px solid ${theme.colors.borderStrong};
        `
      : css`
          background-color: ${$estado === "pronta" ? theme.colors.success : theme.colors.danger};
          color: ${$estado === "pronta" ? theme.colors.onSuccess : theme.colors.onDanger};
        `}
`;

export const Textos = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const Titulo = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Apoio = styled.span<{ $estado: EstadoSecao }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $estado }) => ($estado === "erro" ? theme.colors.danger : theme.colors.textMuted)};
`;

// Celular: secundária ao lado da principal, que ocupa o resto. Painel lateral: principal em cima, ambas na largura toda.
export const Acoes = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;

  & > * {
    flex: 1 1 auto;
  }

  & > :last-child {
    flex-grow: 2;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: column-reverse;

    & > * {
      width: 100%;
    }
  }
`;
