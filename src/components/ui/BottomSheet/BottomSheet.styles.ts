"use client";

import styled from "styled-components";

// Altura da folha do teclado de toque (publicada pelo KeyboardSheet); sem teclado aberto vale 0.
const TECLADO_ALTURA = "var(--teclado-altura, 0px)";

// Celular: a folha sobe acima do menu inferior, com altura máxima que deixa o topo da tela à vista.
// Em md ou mais ela vira um painel lateral à direita, com a altura da janela.
export const Folha = styled.dialog`
  position: fixed;
  inset: auto 0 calc(${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px)) 0;
  width: 100%;
  max-width: none;
  max-height: min(
    80dvh,
    calc(100dvh - ${({ theme }) => theme.layout.bottomNavReserved} - env(safe-area-inset-bottom, 0px) - ${({ theme }) => theme.space[5]}px)
  );
  margin: 0;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: none;
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;

  &[open] {
    display: flex;
    flex-direction: column;
  }

  &::backdrop {
    background-color: rgba(14, 23, 41, 0.5);
  }

  html[data-teclado] & {
    bottom: ${TECLADO_ALTURA};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    inset: 0 0 0 auto;
    width: min(440px, 100%);
    max-height: none;
    height: 100dvh;
    border: none;
    border-left: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0;
  }
`;

export const Cabecalho = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Alca = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.space[1]}px;
  left: 50%;
  width: 40px;
  height: 4px;
  margin-left: -20px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.borderStrong};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

export const Titulo = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Fechar = styled.button`
  display: grid;
  place-items: center;
  width: ${({ theme }) => theme.layout.touchTarget};
  height: ${({ theme }) => theme.layout.touchTarget};
  margin-right: -${({ theme }) => theme.space[2]}px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Corpo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  overflow-y: auto;
`;

export const Rodape = styled.div`
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
