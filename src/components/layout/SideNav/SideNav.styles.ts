"use client";

import styled, { css } from "styled-components";

// Nome do item: invisível com o menu recolhido (só o ícone aparece) e visível quando ele expande.
// Continua no DOM, então o leitor de tela lê o nome mesmo com o menu recolhido.
export const Rotulo = styled.span`
  opacity: 0;

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.12s ease;
  }
`;

// Menu lateral: só existe a partir de `lg`; abaixo disso a navegação é a barra inferior.
// Recolhido mostra só os ícones; ao passar o mouse ou focar um item, expande por cima do conteúdo (sem empurrá-lo).
export const Aside = styled.nav`
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 21;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[1]}px;
    width: ${({ theme }) => theme.layout.sideNavWidth};
    padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[2]}px;
    overflow: hidden;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.background};

    @media (prefers-reduced-motion: no-preference) {
      transition:
        width 0.18s ease,
        box-shadow 0.18s ease;
    }

    &:hover,
    &:focus-within {
      width: ${({ theme }) => theme.layout.sideNavExpandedWidth};
      box-shadow: ${({ theme }) => theme.shadows.md};

      ${Rotulo} {
        opacity: 1;
      }
    }
  }
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const itemStyles = css<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: 44px;
  /* Com o menu recolhido (72px) o ícone de 22px fica centralizado: (72 - 16 - 22) / 2 = 17px de cada lado. */
  padding: 0 17px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $active }) => ($active ? theme.fontWeights.bold : theme.fontWeights.medium)};
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;

  svg {
    flex: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -2px;
  }

  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) => theme.colors.primarySoft};
      color: ${({ theme }) => theme.colors.text};
    }
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      &::before {
        content: "";
        position: absolute;
        top: 20%;
        bottom: 20%;
        left: 0;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background-color: ${theme.colors.primary};
      }
    `}
`;

export const ItemLink = styled.a<{ $active: boolean }>`
  ${itemStyles}
`;

export const ItemButton = styled.button<{ $active: boolean }>`
  ${itemStyles}
`;
