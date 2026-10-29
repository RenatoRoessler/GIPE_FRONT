"use client";

import styled from "styled-components";

// Mesmo padrão visual das listas de Mensalistas e Gestão de Preços; a Table já vira cartões no celular.
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
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

// Linha secundária dentro de uma célula (razão social, endereço...).
export const SubText = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
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

// Texto de apoio abaixo dos campos (ex.: o que acontece com um CPF já cadastrado).
export const Aviso = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const SectionTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.space[3]}px;
`;

export const VoltarWrapper = styled.div`
  align-self: flex-start;
`;

// Formulário em seções empilhadas (mesmo ritmo de Sections em Minha Empresa).
export const FormSections = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;
