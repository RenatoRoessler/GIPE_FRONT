"use client";

import styled from "styled-components";

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Topo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const Rotulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const Valor = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.text};
`;

export const Destaque = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const AcaoRetirada = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    & > button {
      width: 100%;
    }
  }
`;

export const Barra = styled.div`
  display: flex;
  height: 12px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.border};
`;

export const TrechoFundo = styled.span<{ $percentual: number }>`
  flex: 0 0 ${({ $percentual }) => $percentual}%;
  background-color: ${({ theme }) => theme.colors.steel};
`;

export const TrechoRetiravel = styled.span<{ $percentual: number }>`
  flex: 0 0 ${({ $percentual }) => $percentual}%;
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const Legenda = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  div {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[1]}px;
  }

  dt {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[2]}px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    padding-left: ${({ theme }) => theme.space[4]}px;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;

export const Amostra = styled.span<{ $tom: "fundo" | "retiravel" }>`
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme, $tom }) => ($tom === "fundo" ? theme.colors.steel : theme.colors.primary)};
`;

export const Linha = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0;

    & > div + div {
      padding-left: ${({ theme }) => theme.space[4]}px;
      border-left: 1px solid ${({ theme }) => theme.colors.border};
    }
  }

  dt {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;

export const Numero = styled.span<{ $tom?: "success" | "danger" }>`
  color: ${({ theme, $tom }) => ($tom ? theme.colors[$tom] : theme.colors.text)};
`;
