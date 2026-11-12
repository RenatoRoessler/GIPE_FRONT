"use client";

import styled from "styled-components";

export const Cabecalho = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

export const Titulo = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space[2]}px;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  line-height: 1.15;
  overflow-wrap: anywhere;
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Aviso = styled.p`
  margin: 0 0 ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-left: 4px solid ${({ theme }) => theme.colors.warn};
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Descricao = styled.p`
  margin: 0 0 ${({ theme }) => theme.space[4]}px;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
`;

export const Secao = styled.section`
  margin-bottom: ${({ theme }) => theme.space[4]}px;
`;

export const SecaoTitulo = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const Dados = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Dado = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Rotulo = styled.dt`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Valor = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`;
