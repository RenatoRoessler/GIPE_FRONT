"use client";

import styled, { css } from "styled-components";

// Moldura do aparelho (objeto físico, igual nos dois temas).
const BEZEL = "#14181F";
const BEZEL_WIDTH = 12;

// No celular a coluna ocupa a tela; em telas largas ela é centralizada e ganha moldura de celular.
export const Screen = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: flex-start;
    padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[3]}px;
  }
`;

export const Column = styled.main`
  position: relative;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 400px;
    min-height: 780px;
    overflow: hidden;
    border: ${BEZEL_WIDTH}px solid ${BEZEL};
    border-radius: 44px;
    box-shadow:
      0 0 0 1px ${({ theme }) => theme.colors.border},
      ${({ theme }) => theme.shadows.md};

    /* Entalhe da câmera. */
    &::before {
      content: "";
      position: absolute;
      top: 8px;
      left: 50%;
      z-index: 1;
      width: 96px;
      height: 22px;
      transform: translateX(-50%);
      border-radius: ${({ theme }) => theme.radii.full};
      background-color: ${BEZEL};
    }
  }
`;

export const Top = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[6]}px;
  border-bottom: 2px dashed ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    /* Abre espaço para o entalhe da moldura. */
    padding-top: ${({ theme }) => theme.space[6]}px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

// Rótulo de seção do guia de marca: JetBrains Mono em caixa alta, na cor de destaque.
export const Eyebrow = styled.p`
  margin-top: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.accent};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const Company = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

// Sobrepõe o cabeçalho: a margem negativa traz o cartão para cima dele.
export const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: -${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[3]}px 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

// QR de saída: o valor é o token da entrada, lido pelo operador para dar baixa no veículo.
export const ExitCard = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  text-align: center;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .code {
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    letter-spacing: 0.12em;
  }
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Status = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: ${({ theme }) => theme.radii.full};
    background-color: currentColor;
  }
`;

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Elapsed = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  text-align: center;

  .label {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-transform: uppercase;
  }

  .time {
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: calc(${({ theme }) => theme.fontSizes.xl} * 2);
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .value {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .value strong {
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

export const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[2]}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-transform: uppercase;
  }

  dd {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
`;

// Ações em linha, cada uma um botão com ícone sobre o nome (as visíveis dividem a largura por igual).
export const Actions = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
`;

const actionTile = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[1]}px;
  min-height: 68px;
  padding: ${({ theme }) => theme.space[2]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-align: center;
  text-decoration: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ActionLink = styled.a`
  ${actionTile}
`;

export const ActionButton = styled.button`
  ${actionTile}
`;

export const ActionError = styled.p`
  grid-column: 1 / -1;
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`;

export const Footnote = styled.p`
  padding: 0 ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-align: center;
`;

// Estados sem comprovante (não encontrado, erro): mensagem centralizada.
export const Message = styled.section`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[3]}px;
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  h1 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;
