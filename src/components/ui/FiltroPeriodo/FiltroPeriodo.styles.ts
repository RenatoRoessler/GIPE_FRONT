"use client";

import styled from "styled-components";

export const Raiz = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// Atalhos de período: botões em linha, que quebram no celular.
export const Atalhos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Campos empilhados no celular e em uma linha a partir de `md`.
export const FiltroForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: flex-start;
  }

  /* Alinha o botão aos campos (que têm rótulo em cima). */
  button {
    align-self: flex-start;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    button {
      margin-top: 28px;
    }
  }
`;
