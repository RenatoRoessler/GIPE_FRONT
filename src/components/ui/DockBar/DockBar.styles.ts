"use client";

import styled, { css } from "styled-components";

// Barra fixa acima do menu inferior. Em telas grandes o menu é lateral e o módulo mostra o conteúdo da barra
// no próprio layout, então ela some (a menos que `$mostrarNoDesktop`).
export type DockCorte = "md" | "lg";

export const Barra = styled.div<{ $mostrarNoDesktop: boolean; $corte: DockCorte }>`
  position: fixed;
  right: 0;
  bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px));
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: ${({ theme }) => theme.layout.dockHeight};
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-top: 2px solid ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.surface};

  /* Com o teclado de toque aberto a barra sai da frente do campo. */
  html[data-teclado] & {
    display: none;
  }

  ${({ $mostrarNoDesktop, $corte, theme }) =>
    !$mostrarNoDesktop &&
    css`
      @media (min-width: ${theme.breakpoints[$corte]}) {
        display: none;
      }
    `}
`;

// Folga no fim do conteúdo para a última linha não ficar atrás da barra; vale só onde a barra aparece
// (abaixo do mesmo ponto de corte da barra).
export const folgaDaBarra = (corte: DockCorte = "lg") => css`
  @media (max-width: ${({ theme }) => Number.parseInt(theme.breakpoints[corte], 10) - 1}px) {
    padding-bottom: calc(var(--dock-altura, 0px) + ${({ theme }) => theme.space[3]}px);
  }
`;
