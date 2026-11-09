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

// Recuo do ícone com o menu recolhido (72px): (72 - 16 - 22) / 2 = 17px de cada lado. O título do grupo usa o mesmo recuo.
const RECUO = 17;
const ICONE = 22;
const TRACO = 24;
// Altura de cada item: compacta, para o menu de um Administrador (15 itens e 3 títulos) caber em telas de notebook sem rolar.
const ALTURA_ITEM = 34;

// Título de cada grupo: o texto aparece com o menu expandido; recolhido, a linha mostra só o traço que separa os grupos.
// A linha tem a mesma altura nos dois estados, para os itens não mudarem de lugar quando o menu expande.
export const TituloGrupo = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: ${({ theme }) => theme.space[4]}px;
  padding: 0 ${RECUO}px;
`;

export const TituloTexto = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
  opacity: 0;

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.12s ease;
  }
`;

// Traço decorativo, centralizado sobre a coluna dos ícones.
export const Traco = styled.span`
  position: absolute;
  left: ${RECUO + (ICONE - TRACO) / 2}px;
  width: ${TRACO}px;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};

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

      ${Rotulo},
      ${TituloTexto} {
        opacity: 1;
      }

      ${Traco} {
        opacity: 0;
      }
    }
  }
`;

// Grupos de itens: rola por dentro quando a altura da tela não comporta tudo, sem barra de rolagem visível.
// O link da versão fica fora deste contêiner, fixo no pé do menu.
export const Grupos = styled.ul`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
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
  min-height: ${ALTURA_ITEM}px;
  /* Com o menu recolhido o ícone fica centralizado (ver RECUO). */
  padding: 0 ${RECUO}px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
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

// Versão atual, no pé do menu: leva à página de atualizações. Fica visível também com o menu recolhido.
export const Versao = styled.p`
  margin: auto 0 0;
  padding: ${({ theme }) => theme.space[2]}px 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: center;
  white-space: nowrap;
`;
