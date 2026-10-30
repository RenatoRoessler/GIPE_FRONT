"use client";

import type { ButtonHTMLAttributes } from "react";
import styled from "styled-components";

const Botao = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  align-self: flex-start;
  min-height: 44px;
  margin-block: -${({ theme }) => theme.space[2]}px;
  padding: 0 ${({ theme }) => theme.space[2]}px 0 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.text};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// Volta para a tela de origem, acima do título. É um botão (e não um link) para quem chama poder confirmar o descarte.
export function BackButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Botao type="button" {...props}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {children}
    </Botao>
  );
}
