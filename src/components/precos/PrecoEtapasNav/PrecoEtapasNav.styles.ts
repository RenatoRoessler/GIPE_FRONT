"use client";

import styled, { css } from "styled-components";

export type EstadoEtapa = "atual" | "completa" | "pendencia" | "neutra";

export const List = styled.ol`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[2]}px;
  list-style: none;
  margin: 0;
  padding: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const Dot = styled.span<{ $estado: EstadoEtapa; $atual: boolean }>`
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};

  ${({ $estado, theme }) =>
    $estado === "completa" &&
    css`
      background-color: ${theme.colors.success};
      border-color: ${theme.colors.success};
      color: ${theme.colors.background};
    `}

  ${({ $estado, theme }) =>
    $estado === "pendencia" &&
    css`
      background-color: ${theme.colors.warn};
      border-color: ${theme.colors.warn};
      color: ${theme.colors.onWarn};
    `}

  ${({ $atual, $estado, theme }) =>
    $atual &&
    $estado !== "completa" &&
    css`
      background-color: ${theme.colors.primary};
      border-color: ${theme.colors.accent};
      color: ${theme.colors.onPrimary};
    `}
`;

export const Botao = styled.button<{ $atual: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: 52px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: ${({ $atual }) => ($atual ? 2 : 1)}px solid
    ${({ theme, $atual }) => ($atual ? theme.colors.accent : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Textos = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const Titulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Apoio = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
