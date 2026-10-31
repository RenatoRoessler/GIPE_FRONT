"use client";

import styled, { css } from "styled-components";

export type KeyVariant = "char" | "fn" | "action";
export type KeySize = "digit" | "letter" | "fn" | "small";

export const StyledKey = styled.button<{ $variant: KeyVariant; $size: KeySize }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.layout.keyboardKeyHeight};
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  /* Em celular baixo (paisagem) a folha ocuparia mais da metade da tela: a tecla desce ao alvo mínimo. */
  @media (max-height: 479px) {
    height: ${({ theme }) => theme.layout.touchTarget};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.steel};
    opacity: 0.4;
    cursor: default;
  }

  ${({ $size, theme }) => {
    switch ($size) {
      case "digit":
        return css`
          font-size: ${theme.fontSizes.xl};
        `;
      case "letter":
        return css`
          font-size: ${theme.fontSizes.lg};
        `;
      case "small":
        return css`
          font-size: ${theme.fontSizes.xs};
          font-family: ${theme.fontFamilies.sans};
          font-weight: ${theme.fontWeights.extrabold};
        `;
      default:
        return css`
          font-size: ${theme.fontSizes.md};
          font-family: ${theme.fontFamilies.sans};
          font-weight: ${theme.fontWeights.extrabold};
        `;
    }
  }}

  ${({ $variant, theme }) => {
    switch ($variant) {
      case "fn":
        return css`
          background-color: ${theme.colors.background};
          color: ${theme.colors.text};

          &:active:not(:disabled) {
            background-color: ${theme.colors.surfaceMuted};
          }
        `;
      case "action":
        return css`
          background-color: ${theme.colors.primary};
          color: ${theme.colors.onPrimary};

          &:active:not(:disabled) {
            background-color: ${theme.colors.primaryHover};
          }
        `;
      default:
        return css`
          background-color: ${theme.colors.surfaceMuted};
          color: ${theme.colors.text};

          &:active:not(:disabled) {
            background-color: ${theme.colors.border};
          }
        `;
    }
  }}
`;
