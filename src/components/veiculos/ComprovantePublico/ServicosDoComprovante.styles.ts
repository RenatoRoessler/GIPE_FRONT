"use client";

import styled from "styled-components";

// Mesma moldura dos demais cartões do comprovante.
export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

export const Cabecalho = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[2]}px 0;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

// O estado também é dito em texto ao lado; o ícone e a cor só reforçam.
export const Icone = styled.span<{ $pronto: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $pronto }) => ($pronto ? theme.colors.success : theme.colors.surfaceMuted)};
  color: ${({ theme, $pronto }) => ($pronto ? theme.colors.onSuccess : theme.colors.textMuted)};
`;

export const Texto = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const Nome = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  overflow-wrap: anywhere;
`;

export const Situacao = styled.span<{ $pronto: boolean }>`
  color: ${({ theme, $pronto }) => ($pronto ? theme.colors.success : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $pronto }) => ($pronto ? theme.fontWeights.semibold : theme.fontWeights.regular)};
`;

export const Valor = styled.span`
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
`;
