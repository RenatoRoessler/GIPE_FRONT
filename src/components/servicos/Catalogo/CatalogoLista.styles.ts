"use client";

import styled from "styled-components";
import { fg2 } from "./Catalogo.styles";

// O cartão do celular: ícone à esquerda, nome, meta e pílulas das categorias; o preço à direita.
export const CartaoCelular = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:active {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
  }
`;

export const Corpo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const Meta = styled.p`
  margin: 3px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
`;

export const Pilulas = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
`;

export const Pilula = styled.li<{ $fora: boolean }>`
  padding: 3px 7px;
  border-radius: 6px;
  background-color: ${({ theme, $fora }) => ($fora ? theme.colors.dangerSoft : theme.colors.surfaceMuted)};
  color: ${({ theme, $fora }) => ($fora ? theme.colors.danger : fg2)};
  font-size: 11px;
  font-weight: 700;
  text-decoration: ${({ $fora }) => ($fora ? "line-through" : "none")};
`;

export const PrecoCelular = styled.div`
  margin-left: auto;
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;

  small {
    display: block;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 11px;
    font-weight: 600;
  }
`;

// A coluna do celular: folga no fim para o botão flutuante não cobrir o último serviço.
export const ColunaCelular = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding-bottom: ${({ theme }) => theme.layout.fabClearance};
`;

export const ListaCelular = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const CabecalhoCelular = styled.div`
  h2 {
    margin: 2px 0 0;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.15;
    text-wrap: balance;
  }

  p {
    margin: 4px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
`;
