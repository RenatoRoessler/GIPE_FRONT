"use client";

import styled from "styled-components";

// Superfície de cada gráfico e de cada indicador; igual na home e no painel do pátio.
export const Painel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const PainelTitulo = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const Barras = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const BarraItem = styled.li`
  display: grid;
  grid-template-columns: minmax(84px, 120px) minmax(0, 1fr) 32px;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > strong {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

export const Trilho = styled.span`
  display: block;
  height: 14px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
`;

export const Preenchimento = styled.span<{ $percentual: number; $risco: boolean }>`
  display: block;
  width: ${({ $percentual }) => $percentual}%;
  height: 100%;
  background-color: ${({ theme, $risco }) => ($risco ? theme.colors.danger : theme.colors.primary)};
  border-radius: ${({ theme }) => theme.radii.sm};

  @media (prefers-reduced-motion: no-preference) {
    transition: width 0.3s ease;
  }
`;

export const RoscaLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
`;

export const RoscaFigura = styled.div`
  position: relative;
  flex: none;
  width: 112px;
  height: 112px;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
`;

export const RoscaCentro = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

export const Legenda = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[2]}px;
  }

  strong {
    font-variant-numeric: tabular-nums;
  }
`;

export const Amostra = styled.span<{ $cor: "primary" | "steel" }>`
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $cor }) => theme.colors[$cor]};
`;

export const Colunas = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 120px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

export const Coluna = styled.span<{ $percentual: number; $pico: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  height: ${({ $percentual }) => $percentual}%;
  min-height: 2px;
  background-color: ${({ theme, $pico }) => ($pico ? theme.colors.warn : theme.colors.primary)};
  border-radius: ${({ theme }) => theme.radii.sm} ${({ theme }) => theme.radii.sm} 0 0;
`;

export const EixoHoras = styled.div`
  display: flex;
  gap: 3px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;

  span {
    flex: 1 1 0;
    min-width: 0;
    text-align: center;
  }
`;
