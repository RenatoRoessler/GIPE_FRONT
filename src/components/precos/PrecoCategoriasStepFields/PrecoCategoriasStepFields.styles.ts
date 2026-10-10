"use client";

import styled from "styled-components";

export const Group = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
`;

export const GroupLegend = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const ChipLabel = styled.label<{ $checked: boolean; $disabled: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid ${({ $checked, theme }) => ($checked ? theme.colors.primary : theme.colors.border)};
  background-color: ${({ $checked, theme }) => ($checked ? theme.colors.primary : theme.colors.surface)};
  color: ${({ $checked, theme }) => ($checked ? theme.colors.onPrimary : theme.colors.text)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

// O checkbox nativo fica sobreposto e invisível: mantém teclado e leitor de tela sem reimplementar o papel.
export const ChipInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
`;

export const SummaryArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin-top: ${({ theme }) => theme.space[4]}px;
`;
