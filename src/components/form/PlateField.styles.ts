"use client";

import styled from "styled-components";

const ACTION_SIZE = 40;

// Campo transparente dentro da placa: o PlateDisplay faz o papel da caixa do input.
export const PlateInput = styled.input<{ $hasAction?: boolean }>`
  width: 100%;
  min-width: 0;
  /* Com ação à direita, o espaço é reservado dos dois lados para o número seguir centralizado. */
  padding: 0 ${({ theme, $hasAction }) => ($hasAction ? `${ACTION_SIZE + theme.space[2]}px` : `${theme.space[2]}px`)};
  border: none;
  background: transparent;
  color: inherit;
  text-align: center;
  font: inherit;
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.steel};
  }
`;

// O foco mostra um anel na placa inteira, já que o input não tem borda própria.
export const PlateFrame = styled.div`
  border-radius: ${({ theme }) => theme.radii.md};

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const PlateRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const PlateAction = styled.div`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.space[2]}px;
  display: flex;
  transform: translateY(-50%);
`;
