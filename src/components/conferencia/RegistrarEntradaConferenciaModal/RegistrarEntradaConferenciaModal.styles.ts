"use client";

import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Placa = styled.div`
  width: min(220px, 100%);
  margin: 0 auto ${({ theme }) => theme.space[3]}px;
`;

// O que falta para registrar. No rodapé em coluna (celular) o último filho fica no topo, logo acima do botão principal;
// em linha (a partir de `sm`) ele vai para a esquerda, longe dos botões.
export const Pendencia = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    order: -1;
    margin-right: auto;
    align-self: center;
    text-align: left;
  }
`;
