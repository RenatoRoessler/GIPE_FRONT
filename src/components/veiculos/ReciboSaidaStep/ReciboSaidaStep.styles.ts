"use client";

import styled, { createGlobalStyle } from "styled-components";

export const Success = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Receipt = styled.article`
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const ReceiptHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  text-align: center;

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Divider = styled.hr`
  width: 100%;
  margin: ${({ theme }) => theme.space[1]}px 0;
  border: none;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

export const Rows = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

export const ReceiptPlaca = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.08em;
`;

export const Total = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-variant-numeric: tabular-nums;
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

// Nó fora do app para a impressão: na tela fica oculto e, ao imprimir, é a única coisa visível.
export const PrintStyles = createGlobalStyle`
  #recibo-print-root {
    display: none;
  }

  @media print {
    body > *:not(#recibo-print-root) {
      display: none !important;
    }

    #recibo-print-root {
      display: block;
      background: white;
      color: black;
    }

    #recibo-print-root * {
      color: black !important;
      background: transparent !important;
      border-color: black !important;
      box-shadow: none !important;
    }
  }
`;
