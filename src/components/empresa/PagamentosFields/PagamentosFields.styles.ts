"use client";

import styled from "styled-components";

export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
`;

export const Legend = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Meios = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Linha = styled.div<{ $checked: boolean; $hasError: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: 56px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid
    ${({ theme, $checked, $hasError }) =>
      $hasError ? theme.colors.danger : $checked ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $checked }) => ($checked ? theme.colors.primarySoft : theme.colors.background)};
  transition: border-color 0.15s ease, background-color 0.15s ease;
`;

export const Icone = styled.span`
  display: flex;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ErroGrupo = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.danger};
`;
