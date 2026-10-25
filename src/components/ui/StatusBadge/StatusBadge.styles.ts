"use client";

import styled, { css } from "styled-components";

export type StatusBadgeTone = "success" | "neutral" | "info" | "warn" | "danger" | "avulso" | "mensal" | "conveniado";

export const StyledStatusBadge = styled.span<{ $tone: StatusBadgeTone }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;

  ${({ $tone, theme }) => {
    switch ($tone) {
      case "success":
        return css`
          background-color: ${theme.colors.surface};
          color: ${theme.colors.success};
          box-shadow: inset 0 0 0 1px ${theme.colors.success};
        `;
      case "info":
        return css`
          background-color: ${theme.colors.primarySoft};
          color: ${theme.colors.link};
        `;
      case "warn":
        return css`
          background-color: ${theme.colors.warn};
          color: ${theme.colors.onWarn};
        `;
      // O texto usa a cor do tema (danger sobre fundo claro não alcança 4,5:1); o ponto reforça sem carregar o texto.
      case "danger":
        return css`
          gap: ${theme.space[2]}px;
          background-color: ${theme.colors.dangerSoft};
          color: ${theme.colors.text};

          &::before {
            content: "";
            flex: none;
            width: 8px;
            height: 8px;
            border-radius: ${theme.radii.full};
            background-color: ${theme.colors.danger};
          }
        `;
      // Tipo de cliente: cor própria da marca, com texto sempre em asfalto.
      case "avulso":
      case "mensal":
      case "conveniado":
        return css`
          background-color: ${theme.colors.cliente[$tone]};
          color: ${theme.colors.onPrimary};
        `;
      default:
        return css`
          background-color: ${theme.colors.surface};
          color: ${theme.colors.textMuted};
          box-shadow: inset 0 0 0 1px ${theme.colors.border};
        `;
    }
  }}
`;
