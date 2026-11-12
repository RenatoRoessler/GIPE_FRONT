"use client";

import styled from "styled-components";

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Linha = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[1]}px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: 0;
  }
`;

export const Valor = styled.span<{ $apagado?: boolean }>`
  flex-shrink: 0;
  color: ${({ theme, $apagado }) => ($apagado ? theme.colors.textMuted : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const Total = styled.p`
  margin: 0 auto 0 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`;

export const Mensagem = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;
