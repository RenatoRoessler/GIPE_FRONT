"use client";

import styled, { css } from "styled-components";

const TOUCH_TARGET = "44px";

// Barra fixa na base, em todas as larguras. O contêiner externo ocupa a janela (é ele que se mede);
// o interno limita a largura do conteúdo em telas grandes.
export const Bar = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  /* Filete em sombra, e não em borda: a borda somaria 1px à altura e cobriria o fim da página. */
  box-shadow: 0 -1px 0 ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const BarInner = styled.div<{ $slots: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $slots }) => $slots}, minmax(0, 1fr));
  align-items: stretch;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  height: ${({ theme }) => theme.layout.bottomNavHeight};
  margin: 0 auto;
`;

export const SkeletonSlot = styled.div`
  display: grid;
  place-items: center;
`;

const itemStyles = css<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
  min-height: ${TOUCH_TARGET};
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme, $active }) => ($active ? theme.fontWeights.bold : theme.fontWeights.medium)};
  line-height: 1;
  text-decoration: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -4px;
  }

  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) => theme.colors.primarySoft};
    }
  }

  /* A "faixa de vaga" no topo da aba ativa: o único amarelo da barra. */
  ${({ $active, theme }) =>
    $active &&
    css`
      &::before {
        content: "";
        position: absolute;
        top: -1px;
        left: 22%;
        right: 22%;
        height: 3px;
        border-radius: 0 0 3px 3px;
        background-color: ${theme.colors.primary};
      }
    `}
`;

export const TabLink = styled.a<{ $active: boolean }>`
  ${itemStyles}
`;

export const TabButton = styled.button<{ $active: boolean }>`
  ${itemStyles}
`;

// Rótulo curto da aba; se mesmo assim não couber no espaço, termina em reticências.
export const TabLabel = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Pílula atrás do ícone: só a aba ativa a mostra.
export const IconPill = styled.span<{ $active: boolean }>`
  display: grid;
  place-items: center;
  width: 52px;
  max-width: 100%;
  height: 30px;
  border-radius: 15px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme, $active }) => ($active ? theme.colors.accent : "inherit")};
`;

// Menu estendido: sobe da base no celular; a partir de `md` fica centralizado logo acima da barra.
export const Sheet = styled.dialog`
  position: fixed;
  inset: auto 0 0 0;
  width: 100%;
  max-width: 100%;
  max-height: 82dvh;
  margin: 0;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px
    calc(${({ theme }) => theme.space[3]}px + env(safe-area-inset-bottom, 0px));
  border: none;
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &::backdrop {
    background-color: rgba(14, 23, 41, 0.6);
  }

  @media (prefers-reduced-motion: no-preference) {
    &[open] {
      animation: sheet-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes sheet-up {
      from {
        transform: translateY(24px);
        opacity: 0;
      }
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    inset: auto 0 calc(${({ theme }) => theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${({ theme }) => theme.space[2]}px) 0;
    width: min(480px, 100%);
    max-height: min(82dvh, calc(100dvh - ${({ theme }) => theme.layout.bottomNavHeight} - env(safe-area-inset-bottom, 0px) - ${({ theme }) => theme.space[5]}px));
    margin: 0 auto;
    padding-bottom: ${({ theme }) => theme.space[3]}px;
    border-radius: ${({ theme }) => theme.radii.xl};
  }
`;

export const Grabber = styled.div`
  width: 40px;
  height: 5px;
  margin: 0 auto ${({ theme }) => theme.space[1]}px;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.colors.steel};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

export const SheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[1]}px 0 ${({ theme }) => theme.space[2]}px;
`;

export const SheetTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  font-size: ${({ theme }) => theme.fontSizes.subtitle};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
`;

export const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const SheetList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

// Quadro do ícone de cada linha do menu estendido.
export const IconTile = styled.span`
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.accent};
`;

export const SheetRow = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  font-weight: ${({ theme, $active }) => ($active ? theme.fontWeights.bold : theme.fontWeights.semibold)};
  text-decoration: none;
  /* Linhas de ação são botões: mesma aparência das linhas de link. */
  width: 100%;
  border: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  > svg:last-child {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
