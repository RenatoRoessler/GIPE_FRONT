"use client";

import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// O valor que será pedido na nota: vem do recibo e não pode ser alterado.
export const ValorNota = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};

  .label {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-transform: uppercase;
  }

  .amount {
    font-family: ${({ theme }) => theme.typography.display};
    font-size: calc(${({ theme }) => theme.fontSizes.xl} * 1.5);
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .ref {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

// Confirmação depois de solicitada: substitui o formulário.
export const Confirmacao = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.success};
  }

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    /* Recebe o foco ao confirmar, para o leitor de tela anunciar o resultado. */
    outline: none;
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
    width: 100%;
    text-align: left;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    text-align: right;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;
