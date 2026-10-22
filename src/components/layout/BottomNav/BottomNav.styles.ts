"use client";

import styled, { css } from "styled-components";

const TOUCH_TARGET = "44px";
// Anel escuro externo do foco (como no resto da área logada), para o contorno amarelo ler bem em qualquer fundo.
const FOCUS_RING = "#14202E";

export const Bar = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  height: calc(${({ theme }) => theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const itemStyles = css<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[1]}px;
  min-height: ${TOUCH_TARGET};
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  line-height: 1;
  text-decoration: none;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: -3px;
    box-shadow: inset 0 0 0 6px ${FOCUS_RING};
  }

  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) => theme.colors.surface};
    }
  }

  /* Marca no topo da aba ativa. */
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

// Pílula atrás do ícone: só a aba ativa a mostra.
export const IconPill = styled.span<{ $active: boolean }>`
  display: grid;
  place-items: center;
  width: 52px;
  height: 30px;
  border-radius: 15px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
`;

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
  border-radius: 22px 22px 0 0;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &::backdrop {
    background-color: rgba(20, 32, 46, 0.55);
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

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

export const Grabber = styled.div`
  width: 40px;
  height: 5px;
  margin: 0 auto ${({ theme }) => theme.space[1]}px;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.colors.steel};
`;

export const SheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[1]}px 0 ${({ theme }) => theme.space[2]}px;
`;

export const SheetTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.display};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
`;

export const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
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

export const SheetRow = styled.a<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: 48px;
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  /* Linhas de ação são botões: mesma aparência das linhas de link. */
  width: 100%;
  border: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  svg:last-child {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.warn};
    outline-offset: 2px;
  }
`;
