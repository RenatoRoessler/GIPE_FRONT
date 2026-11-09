"use client";

import styled from "styled-components";

export const Cartao = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: 560px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
`;

export const Legenda = styled.legend`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Linhas = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Linha = styled.div<{ $checked: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-height: 56px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $checked }) => ($checked ? theme.colors.accent : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $checked }) => ($checked ? theme.colors.primarySoft : theme.colors.background)};
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
`;

// Alinha a frase do efeito ao texto do Switch (trilho de 44px + espaço).
export const Efeito = styled.p`
  margin: 0;
  padding-left: ${({ theme }) => theme.space[6]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
  }

  & > button {
    width: 100%;

    @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
      width: auto;
    }
  }
`;

export const Auditoria = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
