"use client";

import styled, { css } from "styled-components";
import type { EstadoGancho } from "@/types/quadroChaves";

const CELL_MIN = "48px";
const LABEL_WIDTH = "28px";

// Grade rolável na horizontal: os alvos de toque nunca encolhem, e o rótulo da linha fica fixo à esquerda.
export const Scroller = styled.div`
  overflow-x: auto;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: min-content;
`;

export const Row = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: ${LABEL_WIDTH} repeat(${({ $colunas }) => $colunas}, minmax(${CELL_MIN}, 1fr));
  gap: ${({ theme }) => theme.space[2]}px;
  align-items: center;
`;

const labelStyle = css`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: center;
`;

export const ColumnHeader = styled.div`
  ${labelStyle}
`;

export const RowHeader = styled.div`
  ${labelStyle}
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Cell = styled.div`
  display: flex;
`;

const estadoStyle = (estado: EstadoGancho) => {
  switch (estado) {
    case "selecionado":
      return css`
        border: 1.5px solid transparent;
        background-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.onPrimary};
      `;
    case "livre":
      return css`
        border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
        background-color: transparent;
        color: ${({ theme }) => theme.colors.text};
      `;
    case "ocupado":
      return css`
        border: 1.5px solid ${({ theme }) => theme.colors.border};
        background-color: ${({ theme }) => theme.colors.primarySoft};
        color: ${({ theme }) => theme.colors.textMuted};
      `;
    case "fora":
      return css`
        border: 1.5px solid transparent;
        background-color: transparent;
        color: ${({ theme }) => theme.colors.textMuted};
        text-decoration: line-through;
      `;
  }
};

export const Gancho = styled.button<{ $estado: EstadoGancho }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: ${CELL_MIN};
  padding: ${({ theme }) => theme.space[1]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;
  ${({ $estado }) => estadoStyle($estado)}

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// Célula que não recebe foco nem toque: gancho ocupado, fora de uso ou já cadastrado.
export const GanchoEstatico = styled(Gancho).attrs({ as: "div" })`
  cursor: default;
`;

export const Legenda = styled.span`
  max-width: 100%;
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-overflow: ellipsis;
  text-decoration: none;
  white-space: nowrap;
`;
