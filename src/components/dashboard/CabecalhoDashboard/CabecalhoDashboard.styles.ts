"use client";

import styled from "styled-components";

export const Raiz = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const Saudacao = styled.div`
  min-width: 0;
`;

export const Titulo = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.typography.displaySize};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

export const Subtitulo = styled.p`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Controles = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: stretch;
    width: 100%;
  }
`;

// Largura do seletor em telas grandes; no celular ocupa a linha toda e os três botões dividem o espaço.
export const Seletor = styled.div`
  min-width: 240px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-width: 0;
  }
`;

export const Navegacao = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    justify-content: space-between;
  }
`;

export const Seta = styled.button`
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  /* O desenho tem 36px, mas a área de toque chega a 44px (WCAG 2.2). */
  &::after {
    content: "";
    position: absolute;
    inset: -4px;
  }

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

export const Rotulo = styled.span`
  min-width: 150px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex: 1;
    min-width: 0;
  }
`;

export const VoltarParaHoje = styled.button`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  margin: -${({ theme }) => theme.space[2]}px 0;
  padding: 0 ${({ theme }) => theme.space[1]}px;
  border: none;
  background: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-self: center;
  }
`;
