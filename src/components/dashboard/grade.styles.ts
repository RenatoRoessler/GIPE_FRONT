"use client";

import styled, { css } from "styled-components";

// Abaixo de `md` a grade vira uma coluna (o mesmo ponto usado por `useMediaQuery` na página).
const abaixoDeMd = css`
  @media (max-width: ${({ theme }) => parseInt(theme.breakpoints.md, 10) - 1}px)
`;

export const Pagina = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
`;

export const Blocos = styled.div<{ $esmaecido?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  opacity: ${({ $esmaecido }) => ($esmaecido ? 0.55 : 1)};

  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.2s ease;
  }
`;

// Faturamento e Pátio agora. Sozinho (período fechado), o faturamento ocupa a linha inteira.
export const Hero = styled.div<{ $solo: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.space[3]}px;
  grid-template-columns: ${({ $solo }) => ($solo ? "minmax(0, 1fr)" : "minmax(0, 1.4fr) minmax(0, 1fr)")};

  ${abaixoDeMd} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

// Gráfico de faturamento e pendências. Sem as pendências (período fechado), o gráfico ocupa a linha inteira.
export const Duas = styled.div<{ $solo: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.space[3]}px;
  grid-template-columns: ${({ $solo }) => ($solo ? "minmax(0, 1fr)" : "minmax(0, 1.5fr) minmax(0, 1fr)")};

  ${abaixoDeMd} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Tres = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[3]}px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${abaixoDeMd} {
    grid-template-columns: minmax(0, 1fr);
  }
`;
