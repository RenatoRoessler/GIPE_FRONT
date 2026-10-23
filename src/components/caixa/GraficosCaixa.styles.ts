"use client";

import styled from "styled-components";

export const Raiz = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const Painel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

export const PainelTitulo = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Formas = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const FormaItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const FormaNome = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const LinhaBarra = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const Trilho = styled.span`
  display: block;
  height: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Preenchimento = styled.span<{ $percentual: number; $tom: "success" | "danger" }>`
  display: block;
  width: ${({ $percentual }) => $percentual}%;
  height: 100%;
  background-color: ${({ theme, $tom }) => theme.colors[$tom]};
`;

export const Legenda = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[1]}px;
  }
`;

export const Amostra = styled.i<{ $tom: "success" | "danger" }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $tom }) => theme.colors[$tom]};
`;

export const Colunas = styled.div`
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  align-items: end;
  gap: 2px;
  height: 140px;
`;

export const Coluna = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1px;
  height: 100%;
`;

export const Haste = styled.span<{ $percentual: number; $tom: "success" | "danger" }>`
  flex: 1 1 0;
  max-width: 8px;
  min-height: ${({ $percentual }) => ($percentual > 0 ? 2 : 0)}px;
  height: ${({ $percentual }) => $percentual}%;
  border-radius: ${({ theme }) => theme.radii.sm} ${({ theme }) => theme.radii.sm} 0 0;
  background-color: ${({ theme, $tom }) => theme.colors[$tom]};
`;

export const Eixo = styled.div`
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 2px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;

  span {
    overflow: visible;
    white-space: nowrap;
  }
`;

export const Detalhes = styled.details`
  font-size: ${({ theme }) => theme.fontSizes.sm};

  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.link};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;
