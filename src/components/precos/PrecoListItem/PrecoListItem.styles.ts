"use client";

import styled from "styled-components";
import type { TipoRegra } from "@/types/preco";

type CorTipo = "primary" | "success" | "warn" | "steel";

export const Item = styled.button<{ $selecionado: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ theme, $selecionado }) => ($selecionado ? theme.colors.accent : "transparent")};
  background-color: ${({ theme, $selecionado }) => ($selecionado ? theme.colors.background : "transparent")};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -3px;
  }
`;

export const Descricao = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  overflow-wrap: anywhere;
`;

export const Meta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
`;

export const Tipo = styled.span<{ $cor: CorTipo }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: ${({ theme }) => theme.radii.sm};
    background-color: ${({ theme, $cor }) => theme.colors[$cor]};
  }
`;

// Só reforça o nome do tipo, que sempre aparece em texto.
export const COR_DO_TIPO: Record<TipoRegra, CorTipo> = {
  1: "primary",
  2: "success",
  3: "warn",
  4: "steel",
};
