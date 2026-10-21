"use client";

import styled from "styled-components";

// Mesmo padrão visual da lista de Gestão de Preços (PrecosList.styles.ts).
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

// Linha de ferramentas da aba: busca (se houver) à esquerda e ação primária à direita.
export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const SearchBox = styled.div`
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 360px;
  }
`;

export const TableArea = styled.div<{ $refreshing: boolean }>`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow-x: auto;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  transition: opacity 0.15s ease;
`;

export const Primary = styled.span`
  display: block;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Linha secundária dentro de uma célula (e-mail, categoria...).
export const SubText = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const RowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[6]}px ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;

export const ErrorArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const SkeletonRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
`;

// Ação de linha só com ícone: o nome acessível vem do aria-label e do title de quem usa.
export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.link};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

// Placas da linha como um único botão: abre a ficha com os veículos.
export const VeiculosTrigger = styled.button`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[1]}px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: inherit;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;
