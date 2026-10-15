"use client";

import styled from "styled-components";
import { Receipt } from "../Recibo.styles";

export const QrBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  text-align: center;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding-left: ${({ theme }) => theme.space[4]}px;
    border-left: 1px dashed ${({ theme }) => theme.colors.border};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Estreito: tudo em coluna (celular). A partir de md, dados à esquerda e QR à direita, sem rolagem no modal.
export const EntradaReceipt = styled(Receipt)`
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: none;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: ${({ theme }) => theme.space[4]}px;
  }
`;
