"use client";

import styled from "styled-components";

export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
`;

// A legend precisa ser filha direta do fieldset para nomear o grupo; o nome da cor escolhida fica dentro dela.
export const Legend = styled.legend`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  padding: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const SelectedName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

// Uma linha só: as amostras encolhem (até 28px) em vez de quebrar e deixar uma cor sozinha na linha de baixo.
export const Swatches = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[1]}px;
`;

// Alvo de toque de 44px; a amostra visível fica no Dot.
export const Swatch = styled.label<{ $disabled: boolean }>`
  position: relative;
  display: grid;
  place-items: center;
  flex: 1 1 44px;
  min-width: 28px;
  max-width: 44px;
  height: 44px;
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

// Radio nativo escondido visualmente: continua focável e navegável por setas.
export const RadioInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const Dot = styled.span<{ $color: string; $checked: boolean }>`
  width: 28px;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $color }) => $color};
  box-shadow: ${({ theme, $checked }) =>
    $checked ? `0 0 0 3px ${theme.colors.background}, 0 0 0 5px ${theme.colors.text}` : "none"};
  transition: box-shadow 0.12s ease;

  ${RadioInput}:focus-visible + & {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 4px;
  }
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
