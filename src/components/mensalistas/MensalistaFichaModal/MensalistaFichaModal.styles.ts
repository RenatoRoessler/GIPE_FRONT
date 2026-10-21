"use client";

import styled from "styled-components";

export const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-top: ${({ theme }) => theme.space[4]}px;
`;

// Mesmo estilo dos títulos de seção do cadastro: pequeno, em caixa alta, discreto.
export const SectionTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const NextStep = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const VeiculoList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const VeiculoItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

export const VeiculoInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const CondutorList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
`;

export const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
