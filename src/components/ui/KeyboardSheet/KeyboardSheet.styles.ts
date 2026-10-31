"use client";

import styled, { keyframes } from "styled-components";

const slideIn = keyframes`
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
`;

export const Sheet = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: ${({ theme }) => theme.layout.keyboardZIndex};
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[1]}px
    calc(${({ theme }) => theme.space[2]}px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  user-select: none;
  -webkit-user-select: none;
  animation: ${slideIn} 180ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  max-width: ${({ theme }) => theme.layout.keyboardMaxWidth};
  margin: 0 auto;
`;

// Linha de teclas de letra: cada tecla divide o espaço, até uma largura máxima.
export const KeyRow = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.space[1]}px;
`;

// `$flexible` tira o teto de largura (barra de espaço e teclas de ação).
export const LetterCell = styled.div<{ $grow?: number; $flexible?: boolean }>`
  flex: ${({ $grow = 1 }) => $grow} 1 0;
  max-width: ${({ $grow = 1, $flexible }) => ($flexible ? "none" : `${44 * $grow}px`)};
  min-width: 0;
`;

// Bloco numérico de 4 colunas, no layout de discador.
export const KeyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Célula sem função do bloco numérico: só ocupa o lugar.
export const EmptyCell = styled.div`
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  opacity: 0.5;
`;
