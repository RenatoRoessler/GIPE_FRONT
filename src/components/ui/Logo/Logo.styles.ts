"use client";

import styled, { css } from "styled-components";

// A logo tem texto azul-marinho: no tema escuro ganha uma base clara para manter a leitura.
export const LogoWrapper = styled.div<{ $onDark: boolean; $align: "center" | "start" }>`
  align-self: ${({ $align }) => ($align === "center" ? "center" : "auto")};
  display: flex;
  padding: ${({ theme, $onDark }) => ($onDark ? `${theme.space[1]}px ${theme.space[2]}px` : 0)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $onDark }) => ($onDark ? theme.colors.text : "transparent")};

  ${({ $align }) =>
    $align === "start" &&
    css`
      img {
        height: 40px;
        width: auto;
      }
    `}
`;
