"use client";

import NextLink from "next/link";
import styled from "styled-components";

export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
`;

export const SecaoCabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
`;

export const PatioLink = styled(NextLink)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: ${({ theme }) => theme.colors.link};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Indicadores = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
`;

export const Indicador = styled.div<{ $alerta?: boolean }>`
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  dd {
    margin: 0;
    color: ${({ theme, $alerta }) => ($alerta ? theme.colors.danger : theme.colors.accent)};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: 40px;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

export const Detalhe = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.space[1]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`;

export const Graficos = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;

  /* O gráfico de chegadas é o último e o mais largo: ocupa a linha toda no tablet e duas colunas no computador. */
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > :last-child {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));

    > :last-child {
      grid-column: span 2;
    }
  }
`;

export const Mensagem = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
`;
