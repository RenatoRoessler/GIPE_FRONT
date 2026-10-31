"use client";

import styled, { css, DefaultTheme } from "styled-components";

// "completa" se adapta à largura disponível (coluna estreita ou faixa larga); "compacta" é a linha do celular.
export type CredencialVariant = "completa" | "compacta";

// O tema escuro usa o amarelo também como cor de destaque; é o que o diferencia do claro.
function isTemaEscuro(theme: DefaultTheme) {
  return theme.colors.accent === theme.colors.primary;
}

// No claro a credencial é asfalto sobre giz; no escuro, um degrau acima da superfície.
export function fundoCredencial(theme: DefaultTheme) {
  return isTemaEscuro(theme) ? theme.colors.surfaceMuted : theme.colors.text;
}

export function textoCredencial(theme: DefaultTheme) {
  return isTemaEscuro(theme) ? theme.colors.text : theme.colors.background;
}

export const Cartao = styled.section<{ $variant: CredencialVariant }>`
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => fundoCredencial(theme)};
  color: ${({ theme }) => textoCredencial(theme)};

  ${({ $variant, theme }) =>
    $variant === "completa" &&
    css`
      box-shadow: ${theme.shadows.md};
    `}
`;

export const Corpo = styled.div<{ $variant: CredencialVariant }>`
  display: grid;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;

  ${({ $variant }) =>
    $variant === "completa" &&
    css`
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      align-items: start;
    `}

  ${({ $variant, theme }) =>
    $variant === "compacta" &&
    css`
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: ${theme.space[2]}px;
      padding: ${theme.space[2]}px ${theme.space[3]}px;
    `}
`;

export const Campo = styled.div`
  min-width: 0;
`;

export const Rotulo = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.75;
`;

export const Valor = styled.strong<{ $vazio?: boolean; $destaque?: boolean }>`
  display: block;
  margin-top: 2px;
  overflow-wrap: anywhere;
  font-size: ${({ theme, $destaque }) => ($destaque ? theme.fontSizes.lg : theme.fontSizes.sm)};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  animation: entrada 0.15s ease-out;

  ${({ $vazio }) =>
    $vazio &&
    css`
      opacity: 0.4;
      font-weight: 400;
    `}

  @keyframes entrada {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Selo de placa: preenchimento amarelo, como o da marca (`primary` só como preenchimento).
export const Selo = styled.span<{ $vazio?: boolean }>`
  padding: 2px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  opacity: ${({ $vazio }) => ($vazio ? 0.4 : 1)};
`;

export const Dias = styled.ul`
  display: flex;
  gap: ${({ theme }) => theme.space[1]}px;
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  padding: 0;
  list-style: none;
`;

export const Dia = styled.li<{ $estado: "aberto" | "24h" | "fechado" }>`
  flex: 1;
  display: grid;
  place-items: center;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  background-color: ${({ theme, $estado }) =>
    $estado === "fechado" ? "transparent" : theme.colors.primary};
  color: ${({ theme, $estado }) =>
    $estado === "fechado" ? "inherit" : theme.colors.onPrimary};
  border: 1px solid ${({ theme, $estado }) => ($estado === "fechado" ? theme.colors.steel : "transparent")};
  opacity: ${({ $estado }) => ($estado === "fechado" ? 0.6 : 1)};
`;

export const Pagamentos = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  opacity: 0.8;
`;

export const Abrir = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: 1px solid currentColor;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => textoCredencial(theme)};
    outline-offset: 2px;
  }
`;
