"use client";

import styled, { css } from "styled-components";

export const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
`;

export const Legend = styled.legend`
  padding: 0;
  margin-bottom: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const Options = styled.div<{ $withIcon?: boolean; $columns?: number; $card?: boolean; $inline?: boolean }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns, $withIcon, $card }) => $columns ?? ($card ? 1 : $withIcon ? 3 : 2)}, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(${({ $columns, $card }) => $columns ?? ($card ? 2 : 3)}, minmax(0, 1fr));
  }

  /* Em linha: rádios simples lado a lado, quebrando linha quando não cabem. */
  ${({ $inline, theme }) =>
    $inline &&
    css`
      display: flex;
      flex-wrap: wrap;
      column-gap: ${theme.space[4]}px;
      row-gap: ${theme.space[1]}px;
    `}

  /* Cartões com selo sobre a borda precisam de folga acima da primeira linha. */
  ${({ $card, theme }) =>
    $card &&
    css`
      padding-top: ${theme.space[2]}px;
      row-gap: ${theme.space[3]}px;
    `}
`;

export const Tile = styled.label<{
  $checked: boolean;
  $disabled: boolean;
  $hasError: boolean;
  $withIcon?: boolean;
  $card?: boolean;
  $highlight?: boolean;
  $inline?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid
    ${({ theme, $checked, $hasError }) =>
      $checked ? theme.colors.accent : $hasError ? theme.colors.danger : theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $checked }) => ($checked ? theme.colors.primarySoft : theme.colors.background)};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $checked }) => ($checked ? theme.fontWeights.bold : theme.fontWeights.medium)};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;

  /* Com ícone o tile segue o botão de categoria do layout de referência: ícone sobre o nome, e o selecionado inverte as cores. */
  ${({ $withIcon, $checked, theme }) =>
    $withIcon &&
    css`
      flex-direction: column;
      justify-content: center;
      gap: ${theme.space[2]}px;
      min-height: 92px;
      padding: ${theme.space[2]}px;
      border-radius: ${theme.radii.lg};
      font-weight: ${theme.fontWeights.medium};
      text-align: center;
      line-height: 1.2;
      ${$checked &&
      css`
        border: 2px solid ${theme.colors.text};
        background-color: ${theme.colors.text};
        color: ${theme.colors.background};
      `}
    `}

  /* Cartão: conteúdo livre; o destaque (com selo) tem borda de acento fixa e a seleção também engrossa a borda. */
  ${({ $card, $highlight, $checked, $hasError, theme }) =>
    $card &&
    css`
      align-items: flex-start;
      min-height: ${theme.layout.touchTarget};
      padding: ${theme.space[3]}px;
      border-radius: ${theme.radii.lg};
      ${($highlight || $checked) &&
      css`
        border-width: 2px;
        border-color: ${$hasError ? theme.colors.danger : theme.colors.accent};
      `}
    `}

  /* Em linha: sem caixa, só a marca e o texto (o alvo de toque segue com a altura mínima). */
  ${({ $inline, $checked }) =>
    $inline &&
    css`
      padding: 0;
      border: none;
      border-radius: 0;
      background-color: transparent;
      font-weight: ${({ theme }) => ($checked ? theme.fontWeights.bold : theme.fontWeights.medium)};
    `}

  &:hover {
    border-color: ${({ theme, $disabled, $inline }) => ($disabled || $inline ? undefined : theme.colors.accent)};
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
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

// A seleção também é dita pela marca, não só pela cor.
export const IconSlot = styled.span`
  display: flex;
  color: inherit;
`;

export const Mark = styled.span<{ $checked: boolean; $withIcon?: boolean; $card?: boolean }>`
  /* Com ícone a seleção é dita pela inversão de cores do tile, sem a marca. */
  display: ${({ $withIcon }) => ($withIcon ? "none" : "grid")};
  ${({ $card, theme }) =>
    $card &&
    css`
      position: absolute;
      top: ${theme.space[3]}px;
      right: ${theme.space[3]}px;
    `}
  place-items: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid ${({ theme, $checked }) => ($checked ? theme.colors.accent : theme.colors.borderStrong)};
  border-radius: ${({ theme }) => theme.radii.full};

  &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radii.full};
    background-color: ${({ theme }) => theme.colors.accent};
    transform: scale(${({ $checked }) => ($checked ? 1 : 0)});
    transition: transform 0.12s ease;
  }
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`;

// Selo de texto sobre a borda superior: o destaque não depende só da cor.
export const Badge = styled.span`
  position: absolute;
  top: 0;
  left: ${({ theme }) => theme.space[3]}px;
  transform: translateY(-50%);
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

// Abaixo de `md` o valor fica à direita do nome; a partir dele tudo empilha.
export const CardBody = styled.span`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "nome aside"
    "detail aside";
  align-items: start;
  column-gap: ${({ theme }) => theme.space[3]}px;
  row-gap: ${({ theme }) => theme.space[1]}px;
  flex: 1;
  min-width: 0;
  /* Espaço para a marca de seleção no canto. */
  padding-right: ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "nome"
      "aside"
      "detail";
  }
`;

export const CardLabel = styled.span`
  grid-area: nome;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const CardAside = styled.span`
  grid-area: aside;
  align-self: center;
`;

export const CardDetail = styled.span`
  grid-area: detail;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.textMuted};
`;
