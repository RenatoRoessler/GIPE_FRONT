"use client";

import styled from "styled-components";

// Listra diagonal de faixa de estacionamento: assinatura visual da marca, só decorativa.
const Faixa = styled.div<{ $fundo: string }>`
  height: ${({ theme }) => theme.space[2] + 2}px;
  background: repeating-linear-gradient(
    -45deg,
    ${({ theme }) => theme.colors.primary} 0 14px,
    ${({ $fundo }) => $fundo} 14px 28px
  );
`;

export interface StripeBarProps {
  // Cor do fundo sobre o qual a listra aparece (a segunda cor da listra).
  fundo: string;
}

export function StripeBar({ fundo }: StripeBarProps) {
  return <Faixa $fundo={fundo} aria-hidden="true" />;
}
