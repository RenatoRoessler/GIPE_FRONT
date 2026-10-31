"use client";

import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// Atalhos acima da lista; o ajuste dia a dia continua logo abaixo.
export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const DayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: 0;
  }
`;

// Celular: cada dia é um cartão de duas linhas (nome e controles; horários abaixo). Desktop: uma linha só.
export const DayRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  align-items: start;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 140px auto auto 1fr 1fr;
    align-items: end;
    padding: ${({ theme }) => theme.space[3]}px 0;
    border: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0;
    background-color: transparent;

    &:last-child {
      border-bottom: none;
    }
  }
`;

export const DayName = styled.span`
  grid-column: 1 / -1;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: auto;
    align-self: center;
  }
`;
