"use client";

import styled from "styled-components";

export type TipoClienteBadgeSize = "sm" | "md";

const TAMANHO = { sm: { lado: 20, fonte: "xs" }, md: { lado: 26, fonte: "xs" } } as const;

// Cor própria da marca por tipo de cliente; a inicial sempre em asfalto (`onPrimary`), nos dois temas.
export const Selo = styled.span<{ $tipo: "avulso" | "mensal" | "conveniado"; $size: TipoClienteBadgeSize }>`
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => TAMANHO[$size].lado}px;
  height: ${({ $size }) => TAMANHO[$size].lado}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $tipo }) => theme.colors.cliente[$tipo]};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: ${({ theme, $size }) => theme.fontSizes[TAMANHO[$size].fonte]};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  line-height: 1;
`;
