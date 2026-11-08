"use client";

import styled from "styled-components";

// Estilos compartilhados pelas etapas da conferência. Abaixo de `breakpoints.md` tudo vai em uma coluna; o rodapé de ação
// fica colado acima da barra de navegação inferior e, em telas maiores, segue o fluxo da página.

export const COLUNA_MAX = "560px";

export const Coluna = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: ${COLUNA_MAX};
  margin: 0 auto;
`;

export const Cabecalho = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: ${({ theme }) => theme.layout.touchTarget};
`;

export const Titulos = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

export const Titulo = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.subtitle};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  color: ${({ theme }) => theme.colors.text};
`;

// Rótulo pequeno em fonte monoespaçada: data e hora, nome da seção.
export const Rotulo = styled.span`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Numero = styled.span`
  font-variant-numeric: tabular-nums;
`;

export const Rodape = styled.div`
  position: sticky;
  bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px));
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0 -${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  & > button {
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    margin: 0;
    padding: ${({ theme }) => theme.space[2]}px 0 0;
    border-top: 0;
    background-color: transparent;
  }
`;

export const LadoALado = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[2]}px;

  & > button {
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }

  /* Com a fonte do sistema aumentada o texto não cabe lado a lado: empilha em vez de quebrar a palavra. */
  @media (max-width: 359px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
