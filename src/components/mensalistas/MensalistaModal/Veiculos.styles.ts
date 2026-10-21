"use client";

import styled from "styled-components";

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin-top: ${({ theme }) => theme.space[2]}px;
`;

// Título de seção do formulário: pequeno, em caixa alta, como nos cadastros de preço.
export const SectionTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`;

export const ItemBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding-top: ${({ theme }) => theme.space[2]}px;
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const CondutoresBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const CondutorRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr auto;
  }

  /* No celular o botão de remover fica ao lado do nome; o CPF desce para a linha de baixo. */
  & > :nth-child(2) {
    grid-column: 1 / -1;
    grid-row: 2;

    @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
      grid-column: auto;
      grid-row: auto;
    }
  }
`;

// O botão de remover alinha com a caixa do campo, abaixo do rótulo.
export const RowAction = styled.div`
  padding-top: ${({ theme }) => theme.space[5]}px;
`;

export const CondutoresActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const CopyBox = styled.div`
  min-width: 220px;
`;

export const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;
