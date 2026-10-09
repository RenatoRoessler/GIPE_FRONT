"use client";

import styled, { css } from "styled-components";

// O logo tem versões para fundo claro e escuro (trocadas em Logo.tsx), então não precisa de base própria.
export const LogoWrapper = styled.div<{ $align: "center" | "start" }>`
  align-self: ${({ $align }) => ($align === "center" ? "center" : "auto")};
  display: flex;

  ${({ $align }) =>
    $align === "start" &&
    css`
      img {
        height: 52px;
        width: auto;
      }
    `}
`;
