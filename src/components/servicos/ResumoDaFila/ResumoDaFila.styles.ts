"use client";

import styled, { css } from "styled-components";

export const Lista = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const pilula = css`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`;

export const Chip = styled.li`
  ${pilula}
`;

export const Atrasados = styled(Chip)`
  border-color: ${({ theme }) => theme.colors.danger};
  background-color: ${({ theme }) => theme.colors.dangerSoft};
`;

// Quando a pílula leva a uma aba, o <li> só guarda a posição na lista e o botão é a pílula.
export const Item = styled.li`
  display: inline-flex;
`;

export const ChipBotao = styled.button<{ $atual?: boolean; $atrasados?: boolean }>`
  ${pilula}
  min-height: ${({ theme }) => theme.layout.touchTarget};
  font-family: inherit;
  cursor: pointer;
  border-color: ${({ theme, $atual, $atrasados }) => ($atual ? theme.colors.text : $atrasados ? theme.colors.danger : theme.colors.border)};
  background-color: ${({ theme, $atrasados }) => ($atrasados ? theme.colors.dangerSoft : theme.colors.surface)};

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Ponto = styled.span<{ $tom: "neutro" | "andamento" | "pronto" }>`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background-color: ${({ theme, $tom }) => ($tom === "pronto" ? theme.colors.success : $tom === "andamento" ? theme.colors.warn : theme.colors.textMuted)};
`;
