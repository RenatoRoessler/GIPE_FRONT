"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

export const Cartao = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const Topo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Entrada = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
`;

export const NomeServico = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Detalhe = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// Alvo de toque confortável: o lavador usa a fila de pé, com a mão suja.
export const Acao = styled(Button)`
  width: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
`;

export const Cancelar = styled.button`
  align-self: flex-start;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[1]}px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;
