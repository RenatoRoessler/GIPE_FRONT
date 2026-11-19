"use client";

import styled from "styled-components";

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-top: ${({ theme }) => theme.space[3]}px;
`;

// A mesma grade dos três indicadores da página (2 colunas no celular, com o último na linha inteira).
export const Indicadores = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[3]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    & > :last-child {
      grid-column: span 2;
    }
  }
`;
