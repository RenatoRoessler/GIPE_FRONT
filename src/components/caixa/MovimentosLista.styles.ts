"use client";

import styled from "styled-components";

export const Barra = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const GrupoTipo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Opcao = styled.button<{ $ativa: boolean }>`
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $ativa }) => ($ativa ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $ativa }) => ($ativa ? theme.colors.primarySoft : theme.colors.background)};
  color: ${({ theme, $ativa }) => ($ativa ? theme.colors.link : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Contagem = styled.span`
  margin-left: ${({ theme }) => theme.space[1]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Raiz = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Valor = styled.span<{ $tom: "success" | "danger" }>`
  color: ${({ theme, $tom }) => theme.colors[$tom]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

export const Sub = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Esqueletos = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;
