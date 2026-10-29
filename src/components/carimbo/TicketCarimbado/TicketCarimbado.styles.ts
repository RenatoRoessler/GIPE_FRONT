"use client";

import styled, { keyframes } from "styled-components";

const subir = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Ticket = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (prefers-reduced-motion: no-preference) {
    animation: ${subir} 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

export const Topo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Titulo = styled.h2`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  svg {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.success};
  }
`;

export const Veiculo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Descricao = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Dados = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[4]}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    overflow-wrap: anywhere;
  }
`;

export const Acoes = styled.div`
  display: flex;
  flex-direction: column;

  button {
    min-height: 44px;
  }
`;
