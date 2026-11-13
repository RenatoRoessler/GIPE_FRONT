"use client";

import styled from "styled-components";

export const Linha = styled.label<{ $marcado: boolean; $desabilitado: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme, $marcado }) => ($marcado ? theme.colors.surfaceMuted : theme.colors.surface)};
  box-shadow: inset 0 0 0 ${({ $marcado }) => ($marcado ? 2 : 1)}px
    ${({ theme, $marcado }) => ($marcado ? theme.colors.accent : theme.colors.borderStrong)};
  cursor: ${({ $desabilitado }) => ($desabilitado ? "not-allowed" : "pointer")};
  opacity: ${({ $desabilitado }) => ($desabilitado ? 0.6 : 1)};
  transition: background-color 0.15s ease;
`;

// O input nativo cobre a linha inteira e fica invisível: o toque em qualquer ponto o alterna e o teclado e o leitor de tela continuam funcionando.
export const Entrada = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
`;

export const Caixa = styled.span<{ $marcado: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radii.sm};
  box-shadow: inset 0 0 0 1px ${({ theme, $marcado }) => ($marcado ? theme.colors.accent : theme.colors.borderStrong)};
  background-color: ${({ theme, $marcado }) => ($marcado ? theme.colors.primary : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.onPrimary};

  svg {
    opacity: ${({ $marcado }) => ($marcado ? 1 : 0)};
  }

  ${Entrada}:focus-visible ~ & {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Texto = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
`;

export const Nome = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Detalhe = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Preco = styled.span<{ $apagado: boolean }>`
  flex-shrink: 0;
  color: ${({ theme, $apagado }) => ($apagado ? theme.colors.textMuted : theme.colors.text)};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;
