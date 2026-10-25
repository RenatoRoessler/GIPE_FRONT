"use client";

import styled from "styled-components";

const StyledRemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export interface RemoveRowButtonProps {
  // Nome acessível completo, ex.: "Remover faixa 2" (o ícone sozinho não tem texto).
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function RemoveRowButton({ label, onClick, disabled = false }: RemoveRowButtonProps) {
  return (
    <StyledRemoveButton type="button" onClick={onClick} disabled={disabled} aria-label={label} title="Remover">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </StyledRemoveButton>
  );
}
