"use client";

import styled from "styled-components";

// Coluna estreita de cupom: borda de topo na cor de aviso e picote antes do QR.
export const Ticket = styled.article`
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  /* Com overflow oculto o cupom poderia encolher dentro do corpo do modal e cortar o QR: ele mantém a altura e o modal rola. */
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-top: 8px solid ${({ theme }) => theme.colors.warn};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const TicketHead = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[2]}px;

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const PlateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;

  > :first-child {
    flex: 1;
    min-width: 0;
  }
`;

export const TicketNumber = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-transform: uppercase;
  }

  strong {
    font-family: ${({ theme }) => theme.typography.display};
    font-size: ${({ theme }) => theme.fontSizes.xl};
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
`;

export const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-transform: uppercase;
  }

  dd {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

// Picote: recortes laterais e linha tracejada separando os dados do QR.
export const Perforation = styled.div`
  display: flex;
  align-items: center;
  height: 24px;

  &::before,
  &::after {
    content: "";
    flex: none;
    width: 12px;
    height: 24px;
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  &::before {
    border-left: none;
    border-radius: 0 12px 12px 0;
  }

  &::after {
    border-right: none;
    border-radius: 12px 0 0 12px;
  }

  hr {
    flex: 1;
    margin: 0 ${({ theme }) => theme.space[1]}px;
    border: none;
    border-top: 2px dashed ${({ theme }) => theme.colors.border};
  }
`;

export const QrBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;
  text-align: center;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const ShortLink = styled.span`
  color: ${({ theme }) => theme.colors.link};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  overflow-wrap: anywhere;
`;

export const TicketFoot = styled.footer`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;
