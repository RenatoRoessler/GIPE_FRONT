"use client";

import styled from "styled-components";

import { Row } from "../shared/RepeatableRows.styles";

export const RowFields = styled.div<{ $withPercent: boolean }>`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: ${({ $withPercent }) => ($withPercent ? "1fr 1fr 1fr" : "1fr 1fr")};
  }
`;

export const RowFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: 44px;
`;

export const Duracao = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Salto = styled.span`
  min-width: 72px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Avisos = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Aviso = styled.li`
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-left: 4px solid ${({ theme }) => theme.colors.warn};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

export const SemAvisos = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.success};
`;

// No desktop os campos, o salto e o botão de remover ficam na mesma linha.
export const FaixaRow = styled(Row)`
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: flex-end;

    > :first-child {
      flex: 1;
      min-width: 0;
    }
  }
`;
