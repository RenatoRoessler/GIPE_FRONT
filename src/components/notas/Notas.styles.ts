"use client";

import styled from "styled-components";
import { TableRow } from "@/components/ui/Table";

// Resumo acima da tabela: quantidade e total em reais.
export const Resumo = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// Moldura da tabela: a partir de `md` é uma tabela com rolagem lateral; abaixo disso cada nota vira um cartão (ver NotaRow).
export const NotasTabela = styled.div<{ $refreshing: boolean }>`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow-x: auto;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  transition: opacity 0.15s ease;

  /* Datas e valores não quebram de linha: a coluna cresce em vez de partir "R$ 15.100,00" ao meio. */
  td[data-label="Solicitada em"],
  td[data-label="Lançada em"],
  td[data-label="Valor"] {
    white-space: nowrap;
  }

  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    border: none;
    border-radius: 0;
    overflow-x: visible;

    table,
    tbody {
      display: block;
    }

    /* O cabeçalho sai da tela, mas segue para leitores de tela; os rótulos vêm de data-label. */
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    td[data-label] {
      white-space: normal;
    }
  }
`;

export const NotaRow = styled(TableRow)`
  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "cliente cliente"
      "data valor"
      "placa lancada";
    align-items: start;
    gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
    padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[1]}px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    & > td {
      display: block;
      min-width: 0;
      padding: 0;
      text-align: left;
      border: none;
    }

    /* Rótulo pequeno acima de cada dado, menos no cliente, que já se explica. */
    & > td:not([data-label="Cliente"])::before {
      content: attr(data-label);
      display: block;
      color: ${({ theme }) => theme.colors.textMuted};
      font-size: ${({ theme }) => theme.fontSizes.xs};
      font-weight: ${({ theme }) => theme.fontWeights.medium};
      text-transform: uppercase;
    }

    & > td[data-label="Cliente"]::before {
      content: none;
    }

    & > td[data-label="Cliente"] {
      grid-area: cliente;
      overflow-wrap: anywhere;
    }

    & > td[data-label="Solicitada em"] {
      grid-area: data;
    }

    & > td[data-label="Valor"] {
      grid-area: valor;
      text-align: right;
    }

    & > td[data-label="Saída"] {
      grid-area: placa;
    }

    & > td[data-label="Lançada em"] {
      grid-area: lancada;
      text-align: right;
    }
  }
`;

export const Dica = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
