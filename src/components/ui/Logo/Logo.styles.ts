"use client";

import styled, { css } from "styled-components";
import { FADE_PARADA_MS } from "./useAnimacaoDoCarro";

// Faixa da rua do carro animado abaixo do símbolo, em fração da altura (28 de 160 unidades do viewBox: o carro
// deitado vai até y 186, com 2 de folga).
const RUA_ABAIXO = 28 / 160;

export const LogoWrapper = styled.div<{
  $align: "center" | "start";
  $tone: "default" | "onYellow";
  $size: number;
  $compact: boolean;
  $animado: boolean;
}>`
  align-self: ${({ $align }) => ($align === "center" ? "center" : "auto")};
  display: flex;
  align-items: center;
  gap: ${({ $size }) => Math.round($size * 0.25)}px;
  /* Vagas na cor de destaque do tema (amarelo no escuro, asfalto no claro); a palavra segue o texto. */
  color: ${({ theme, $tone }) => ($tone === "onYellow" ? "#0E1729" : theme.colors.accent)};

  /* Animado: o carro só aparece dentro da caixa do logo, estendida para baixo até a rua. A faixa da rua ocupa
     espaço no layout (como no protótipo), para o carro nunca passar por cima do que vem abaixo do logo.
     O símbolo fica por cima da palavra. */
  ${({ $animado, $size }) =>
    $animado &&
    css`
      overflow: hidden;
      padding-bottom: ${Math.ceil($size * RUA_ABAIXO)}px;

      svg {
        position: relative;
        z-index: 1;
      }

      [data-carro] {
        transition: opacity ${FADE_PARADA_MS}ms ease;
      }

      /* Impressão sempre em repouso: a propriedade transform vence o atributo e põe o carro na vaga. */
      @media print {
        [data-carro] {
          visibility: visible !important;
          opacity: 1 !important;
          transform: none !important;
        }

        [data-luz] {
          display: none;
        }
      }
    `}

  ${({ $compact, theme }) =>
    $compact &&
    css`
      @media (max-width: calc(${theme.breakpoints.sm} - 1px)) {
        span {
          display: none;
        }
      }
    `}
`;

export const Word = styled.span<{ $tone: "default" | "onYellow"; $size: number }>`
  color: ${({ theme, $tone }) => ($tone === "onYellow" ? "#0E1729" : theme.colors.text)};
  font-family: ${({ theme }) => theme.fontFamilies.sans};
  font-size: ${({ $size }) => Math.round($size * 0.9)}px;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: -0.05em;
  line-height: 1;
`;
