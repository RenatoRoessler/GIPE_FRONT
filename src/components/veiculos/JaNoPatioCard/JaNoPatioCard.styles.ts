"use client";

import styled from "styled-components";

// Aviso amarelo, como no desenho: fundo suave, borda amarela, valor em destaque na cor de acento do tema.
export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.warn};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.warnSoft};
  color: ${({ theme }) => theme.colors.text};
`;

export const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`;

export const Valor = styled.p`
  display: flex;
  align-items: center;
  min-height: 1.2em;
  margin: 0;
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

export const Veiculo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  overflow-wrap: anywhere;
`;

export const Rotulo = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Rows = styled.dl`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: 0;

  div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space[3]}px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
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
