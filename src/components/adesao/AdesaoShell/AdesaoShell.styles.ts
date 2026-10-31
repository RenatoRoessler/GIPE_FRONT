"use client";

import styled from "styled-components";

export const Pagina = styled.main`
  min-height: 100dvh;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

export const Topo = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[5]}px;
  }
`;

export const StepperArea = styled.div`
  flex: 1;
  max-width: 560px;
`;

// Celular: credencial resumida fixa no topo da rolagem; some a partir de `md`.
export const CompactaFixa = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

export const Andamento = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textMuted};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

// Celular: coluna única. Tablet: credencial acima do formulário. Desktop: formulário e credencial lado a lado.
export const Corpo = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "principal";
  gap: ${({ theme }) => theme.space[4]}px;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;
  padding-bottom: calc(${({ theme }) => theme.layout.actionBarHeight} + ${({ theme }) => theme.space[4]}px + env(safe-area-inset-bottom));

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-areas: "credencial" "principal";
    padding: ${({ theme }) => theme.space[5]}px;
    padding-bottom: ${({ theme }) => theme.space[5]}px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: minmax(0, 1fr) ${({ theme }) => theme.layout.credentialWidth};
    grid-template-areas: "principal credencial";
    gap: ${({ theme }) => theme.space[6]}px;
    align-items: start;
  }
`;

export const Principal = styled.div`
  grid-area: principal;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  min-width: 0;
  max-width: 720px;
`;

export const Titulos = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const CredencialArea = styled.aside`
  grid-area: credencial;
  display: none;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: ${({ theme }) => theme.layout.stickyTop};
  }
`;

// Troca de etapa: deslizamento curto com opacidade; sem movimento para quem prefere menos animação.
export const Etapa = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  animation: etapa-entra 0.22s ease-out;

  @keyframes etapa-entra {
    from {
      opacity: 0;
      transform: translateX(12px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
