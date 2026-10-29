"use client";

import styled from "styled-components";

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.surface};

  /* No celular a barra de navegação inferior é fixa: o fim da página ganha a folga dela. */
  padding-bottom: calc(${({ theme }) => theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px));

  /* Em telas grandes a navegação é o menu lateral: o conteúdo abre espaço à esquerda e a folga de baixo some. */
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding-bottom: 0;
    padding-left: ${({ theme }) => theme.layout.sideNavWidth};
  }
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[5]}px;
  }
`;
