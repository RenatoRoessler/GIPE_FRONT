"use client";

import styled from "styled-components";

export const Secoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Secao = styled.section`
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const SecaoCabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
`;

export const SecaoTitulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: -0.01em;
`;

export const Editar = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.link};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Lista = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  margin: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: max-content minmax(0, 1fr);
  }
`;

export const Termo = styled.dt`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Detalhe = styled.dd`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;
