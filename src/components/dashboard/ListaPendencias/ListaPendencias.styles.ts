"use client";

import NextLink from "next/link";
import styled, { css } from "styled-components";
import type { TomPendencia } from "../apresentacao";

export type TomLinha = TomPendencia | "ok";

export const Lista = styled.ul`
  margin: ${({ theme }) => theme.space[2]}px 0 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li`
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  &:first-child {
    border-top: none;
  }
`;

const linha = css`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  color: inherit;
  text-decoration: none;
`;

export const LinhaLink = styled(NextLink)`
  ${linha}

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const LinhaFixa = styled.div`
  ${linha}
`;

function corDoTom(tom: TomLinha, theme: { colors: { danger: string; caution: string; info: string; success: string } }) {
  switch (tom) {
    case "danger":
      return theme.colors.danger;
    case "caution":
      return theme.colors.caution;
    case "info":
      return theme.colors.info;
    case "ok":
      return theme.colors.success;
  }
}

function fundoDoTom(tom: TomLinha, theme: { colors: { dangerSoft: string; cautionSoft: string; infoSoft: string; successSoft: string } }) {
  switch (tom) {
    case "danger":
      return theme.colors.dangerSoft;
    case "caution":
      return theme.colors.cautionSoft;
    case "info":
      return theme.colors.infoSoft;
    case "ok":
      return theme.colors.successSoft;
  }
}

export const Icone = styled.span<{ $tom: TomLinha }>`
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme, $tom }) => fundoDoTom($tom, theme)};
  color: ${({ theme, $tom }) => corDoTom($tom, theme)};
`;

export const Texto = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

export const Titulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const Resumo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Contagem = styled.span<{ $tom: TomLinha }>`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $tom }) => corDoTom($tom, theme)};
`;

export const Seta = styled.span`
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;
