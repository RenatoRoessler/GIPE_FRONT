"use client";

import styled from "styled-components";

// Cartão com identidade própria dentro do ticket: um degrau acima do fundo, com a gota e o rótulo em mono.
export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Titulo = styled.h3`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const Adicionar = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[1]}px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// Estado vazio: um alvo de toque largo e tracejado, que convida à ação sem competir com "Registrar saída".
export const BotaoVazio = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Subtotal = styled.p`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding-top: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  b {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;
