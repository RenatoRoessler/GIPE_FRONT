"use client";

import styled from "styled-components";

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: block;
  }
`;

export const StyledTableHead = styled.thead`
  background-color: ${({ theme }) => theme.colors.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    /* Em cartões os rótulos vêm de data-label; o cabeçalho sai da tela mas segue para leitores de tela. */
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

export const StyledTableBody = styled.tbody`
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: block;
  }
`;

export const StyledTableRow = styled.tr<{ $clickable: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background-color: ${({ $clickable, theme }) => ($clickable ? theme.colors.primarySoft : "transparent")};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: block;
    padding: ${({ theme }) => theme.space[3]}px 0;
  }
`;

export const StyledTableCell = styled.td<{ $align: "left" | "right"; $numeric: boolean }>`
  padding: ${({ theme }) => theme.space[3]}px;
  text-align: ${({ $align }) => $align};
  vertical-align: middle;
  font-variant-numeric: ${({ $numeric }) => ($numeric ? "tabular-nums" : "normal")};

  &[data-head="true"] {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: flex;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space[3]}px;
    padding: ${({ theme }) => theme.space[1]}px 0;
    text-align: right;

    &::before {
      content: attr(data-label);
      font-weight: ${({ theme }) => theme.fontWeights.medium};
      color: ${({ theme }) => theme.colors.textMuted};
      text-align: left;
    }
  }
`;
