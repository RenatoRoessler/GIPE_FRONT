"use client";

import styled, { css } from "styled-components";

export const LogoWrapper = styled.div<{ $align: "center" | "start"; $tone: "default" | "onYellow"; $size: number; $compact: boolean }>`
  align-self: ${({ $align }) => ($align === "center" ? "center" : "auto")};
  display: flex;
  align-items: center;
  gap: ${({ $size }) => Math.round($size * 0.25)}px;
  /* Vagas na cor de destaque do tema (amarelo no escuro, asfalto no claro); a palavra segue o texto. */
  color: ${({ theme, $tone }) => ($tone === "onYellow" ? "#0E1729" : theme.colors.accent)};

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
