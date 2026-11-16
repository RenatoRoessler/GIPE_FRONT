"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

// A faixa lateral diz o status; atrasado: o contorno de `danger` reforça o texto "Passou N min da previsão" (que é quem diz o que houve).
export const Cartao = styled.article<{ $atrasado: boolean; $tom: "neutro" | "andamento" | "pronto" }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 5px solid ${({ theme, $tom }) => ($tom === "pronto" ? theme.colors.success : $tom === "andamento" ? theme.colors.warn : theme.colors.textMuted)};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme, $atrasado }) => ($atrasado ? `inset 0 0 0 2px ${theme.colors.danger}` : theme.shadows.sm)};
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

export const Prisma = styled.span`
  padding: 3px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

export const Identificacao = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const NomeServico = styled.h3`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  svg {
    align-self: center;
    width: 16px;
    height: 16px;
    flex: none;
    color: ${({ theme }) => theme.colors.accent};
  }
`;

export const Mais = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Detalhe = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Acoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

// Alvo de toque confortável: o lavador usa a fila de pé, com a mão suja.
export const Acao = styled(Button)`
  width: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  border-radius: 12px;
  font-weight: 800;
`;

// Ações discretas (voltar um passo, cancelar): texto sublinhado, mas com alvo de toque de 44px.
export const Discreta = styled.button<{ $perigo?: boolean }>`
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
    color: ${({ theme, $perigo }) => ($perigo ? theme.colors.danger : theme.colors.text)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;
