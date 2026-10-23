"use client";

import styled from "styled-components";

export const Lista = styled.ol`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li`
  position: relative;
  display: grid;
  grid-template-columns: 24px 1fr;
  column-gap: ${({ theme }) => theme.space[3]}px;
  padding-bottom: ${({ theme }) => theme.space[4]}px;

  &:last-child {
    padding-bottom: 0;
  }

  /* Fio que liga um evento ao próximo. */
  &:not(:last-child)::before {
    content: "";
    position: absolute;
    top: 20px;
    bottom: 0;
    left: 11px;
    width: 2px;
    background-color: ${({ theme }) => theme.colors.border};
  }
`;

export const Marcador = styled.span<{ $tom: "primary" | "danger" | "steel" | "success" }>`
  z-index: 1;
  align-self: start;
  width: 24px;
  height: 24px;
  border: 6px solid ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.full};
  box-shadow: 0 0 0 1px ${({ theme, $tom }) => theme.colors[$tom]};
  background-color: ${({ theme, $tom }) => theme.colors[$tom]};
`;

export const Corpo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Titulo = styled.p`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Meta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
