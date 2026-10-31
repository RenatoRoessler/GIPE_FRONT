"use client";

import styled from "styled-components";

// No celular a barra fica fixa no rodapé; a página reserva `layout.actionBarHeight` para o conteúdo não ficar sob ela.
export const Barra = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: ${({ theme }) => theme.layout.actionBarHeight};
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  padding-bottom: calc(${({ theme }) => theme.space[2]}px + env(safe-area-inset-bottom));
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};

  & > * {
    flex: 1;
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    position: static;
    justify-content: space-between;
    min-height: 0;
    padding: ${({ theme }) => theme.space[3]}px 0 0;
    background-color: transparent;

    & > * {
      flex: 0 0 auto;
    }
  }
`;
