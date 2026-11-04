"use client";

import styled from "styled-components";

export const Destaque = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  text-align: center;
`;

export const Icone = styled.span<{ $tom: "success" | "danger" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: inset 0 0 0 1.5px ${({ theme, $tom }) => ($tom === "success" ? theme.colors.success : theme.colors.danger)};
  color: ${({ theme, $tom }) => ($tom === "success" ? theme.colors.success : theme.colors.danger)};
`;

export const Periodo = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Numeros = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
`;

export const Numero = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  dd {
    order: -1;
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    font-variant-numeric: tabular-nums;
    letter-spacing: ${({ theme }) => theme.typography.displayTracking};
    line-height: 1.1;
  }

  dt {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

// Aviso que leva às divergências: parece um aviso, mas é um botão.
export const AvisoBotao = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  width: 100%;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Ajustes = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Ajuste = styled.li`
  display: flex;
  gap: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  b {
    min-width: 76px;
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const SemAjustes = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const CampoObservacao = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;

  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;

export const Observacao = styled.textarea<{ $erro: boolean }>`
  width: 100%;
  min-height: 88px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $erro }) => ($erro ? theme.colors.danger : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.md};
  resize: vertical;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme, $erro }) => ($erro ? theme.colors.danger : theme.colors.accent)};
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme, $erro }) => ($erro ? theme.colors.dangerSoft : theme.colors.primarySoft)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

export const Contador = styled.p<{ $acima: boolean }>`
  margin: 0;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $acima }) => ($acima ? theme.colors.danger : theme.colors.textMuted)};
`;
