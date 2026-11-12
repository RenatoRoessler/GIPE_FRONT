"use client";

import styled from "styled-components";

export const Item = styled.button<{ $selecionado: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  width: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  /* A barra lateral marca o selecionado para quem não distingue o fundo. */
  box-shadow: inset 4px 0 0 ${({ theme, $selecionado }) => ($selecionado ? theme.colors.primary : "transparent")};
  background-color: ${({ theme, $selecionado }) => ($selecionado ? theme.colors.background : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -2px;
  }
`;

export const Nome = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  overflow-wrap: anywhere;
`;

export const Linha = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
