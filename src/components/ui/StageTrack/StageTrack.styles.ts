"use client";

import styled, { css, type DefaultTheme } from "styled-components";
import type { StageState } from "./StageTrack";

type TrackSize = "sm" | "md";
type TrackTone = "default" | "success";

const MARK_SIZE: Record<TrackSize, number> = { sm: 10, md: 16 };
// Largura mínima de cada etapa: o conector ocupa o espaço entre duas marcas vizinhas.
const COLUMN_MIN: Record<TrackSize, number> = { sm: 32, md: 88 };
const CONNECTOR_GAP = 4;

function accent(theme: DefaultTheme, tone: TrackTone) {
  return tone === "success" ? theme.colors.success : theme.colors.primary;
}

export const List = styled.ol<{ $size: TrackSize }>`
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(${({ $size }) => COLUMN_MIN[$size]}px, 1fr);
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const Item = styled.li<{ $size: TrackSize; $state: StageState; $tone: TrackTone }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  position: relative;

  /* Conector entre o centro desta marca e o da próxima (colunas de largura igual). */
  &:not(:last-child)::after {
    content: "";
    position: absolute;
    top: ${({ $size }) => MARK_SIZE[$size] / 2 - 1}px;
    left: calc(50% + ${({ $size }) => MARK_SIZE[$size] / 2 + CONNECTOR_GAP}px);
    width: calc(100% - ${({ $size }) => MARK_SIZE[$size] + CONNECTOR_GAP * 2}px);
    height: 2px;
    background-color: ${({ theme, $state, $tone }) =>
      $state === "done" ? accent(theme, $tone) : theme.colors.border};
  }
`;

// A forma muda por estado (cheio, anel, alerta), então a cor nunca é o único sinal.
export const Mark = styled.span<{ $state: StageState; $size: TrackSize; $tone: TrackTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${({ $size }) => MARK_SIZE[$size]}px;
  height: ${({ $size }) => MARK_SIZE[$size]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  flex-shrink: 0;

  ${({ $state, theme, $tone }) => {
    switch ($state) {
      case "done":
        return css`
          background-color: ${accent(theme, $tone)};
          border: 2px solid ${accent(theme, $tone)};
        `;
      case "current":
        return css`
          background-color: ${theme.colors.primarySoft};
          border: 2px solid ${accent(theme, $tone)};
        `;
      case "attention":
        return css`
          background-color: ${theme.colors.warn};
          border: 2px solid ${theme.colors.warn};
          color: ${theme.colors.onWarn};
        `;
      default:
        return css`
          background-color: ${theme.colors.background};
          border: 2px solid ${theme.colors.border};
        `;
    }
  }}
`;

export const Label = styled.span<{ $state: StageState }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme, $state }) => ($state === "current" ? theme.fontWeights.bold : theme.fontWeights.medium)};
  color: ${({ theme, $state }) => ($state === "todo" ? theme.colors.textMuted : theme.colors.text)};
  white-space: nowrap;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
