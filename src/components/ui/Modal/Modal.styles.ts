"use client";

import styled, { css } from "styled-components";

export type ModalSize = "sm" | "md" | "lg";

// Largura máxima por tamanho. No desktop o modal acompanha o conteúdo, entre a largura mínima e a máxima,
// para não ficar maior do que precisa.
const WIDTHS: Record<ModalSize, string> = { sm: "480px", md: "600px", lg: "760px" };
const MIN_WIDTHS: Record<ModalSize, string> = { sm: "360px", md: "440px", lg: "560px" };

// Desktop: caixa centralizada com margem, do tamanho do conteúdo. No celular (abaixo de md) o modal ocupa
// a tela toda, com cabeçalho e rodapé fixos e só o corpo rolando.
export const Dialog = styled.dialog<{ $size: ModalSize; $fullScreenOnMobile: boolean }>`
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;

  ${({ $fullScreenOnMobile, $size, theme }) =>
    $fullScreenOnMobile
      ? css`
          width: 100%;
          max-width: none;
          height: 100dvh;
          max-height: none;
          margin: 0;
          border: none;
          border-radius: 0;

          @media (min-width: ${theme.breakpoints.md}) {
            width: fit-content;
            min-width: min(${MIN_WIDTHS[$size]}, calc(100% - ${theme.space[3] * 2}px));
            /* "auto" esticaria o <dialog> (posicionado com margin auto) até o max-height. */
            height: fit-content;
            margin: auto;
            border: 1px solid ${theme.colors.border};
            border-radius: ${theme.radii.lg};
          }
        `
      : css`
          margin: auto;
          border-radius: ${theme.radii.lg};
          width: calc(100% - ${theme.space[3] * 2}px);

          @media (min-width: ${theme.breakpoints.sm}) {
            width: fit-content;
            min-width: min(${MIN_WIDTHS[$size]}, calc(100% - ${theme.space[3] * 2}px));
          }
        `}

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: ${({ $size }) => WIDTHS[$size]};
    max-height: calc(100dvh - ${({ theme }) => theme.space[4] * 2}px);
  }

  ${({ $fullScreenOnMobile, $size }) =>
    !$fullScreenOnMobile &&
    css`
      max-width: ${WIDTHS[$size]};
      max-height: 100dvh;
    `}

  &[open] {
    display: flex;
    flex-direction: column;
  }

  &::backdrop {
    background-color: rgba(20, 32, 46, 0.6);
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  overflow-y: auto;
`;

export const Footer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;
