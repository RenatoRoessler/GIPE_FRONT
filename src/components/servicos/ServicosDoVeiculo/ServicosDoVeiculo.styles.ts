"use client";

import styled from "styled-components";

export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Titulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Resumo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Linha = styled.li<{ $cancelado: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};
  opacity: ${({ $cancelado }) => ($cancelado ? 0.7 : 1)};

  &:last-child {
    border-bottom: 0;
  }
`;

export const Principal = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Nome = styled.span<{ $cancelado: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: ${({ $cancelado }) => ($cancelado ? "line-through" : "none")};
`;

export const Valor = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const Motivo = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Cancelar = styled.button`
  align-self: flex-start;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0;
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

export const Vazio = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
