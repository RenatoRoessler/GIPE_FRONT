"use client";

import styled from "styled-components";

export const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

export const Titulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Atualizado = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Colunas = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }
`;

export const Coluna = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-height: calc(100dvh - ${({ theme }) => theme.layout.stickyTop} - ${({ theme }) => theme.space[7]}px);
    overflow-y: auto;
    padding: ${({ theme }) => theme.space[2]}px;
    border-radius: ${({ theme }) => theme.radii.lg};
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }
`;

export const TituloColuna = styled.h3`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Vazio = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

// Aviso da troca de status, com a chance de desfazer um engano.
export const Desfazer = styled.div`
  position: fixed;
  left: 50%;
  bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px) + ${({ theme }) => theme.space[3]}px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  width: calc(100vw - ${({ theme }) => theme.space[4] * 2}px);
  max-width: 360px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  transform: translateX(-50%);
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.onSuccess};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const BotaoDesfazer = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

export const VisuallyHidden = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;
