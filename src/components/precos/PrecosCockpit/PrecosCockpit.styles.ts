"use client";

import styled from "styled-components";
import { folgaDaBarra } from "@/components/ui/DockBar";

// Celular: barra do módulo, esteira e detalhe empilhados, com folga no fim para o dock do simulador.
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    gap: ${({ theme }) => theme.space[3]}px;
  }

  ${folgaDaBarra("md")}
`;

// Uma única barra compacta: título à esquerda, ações à direita.
export const BarraModulo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Acoes = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;

  button {
    white-space: nowrap;
  }
`;

// Título da barra do módulo: uma linha só no celular, para a esteira e a placa subirem na primeira tela.
export const Titulo = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  white-space: nowrap;
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  line-height: 1.1;
  min-width: 0;

  /* Telas muito estreitas: o título encolhe para não passar por cima dos botões. */
  @media (max-width: 359px) {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.typography.displaySize};
    white-space: normal;
  }
`;

// Abre a lista completa (busca, filtro e paginação): ícone no celular, com o texto completo no nome acessível.
export const BotaoLista = styled.button`
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.layout.touchTarget};
  height: ${({ theme }) => theme.layout.touchTarget};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: inset 0 0 0 1.5px ${({ theme }) => theme.colors.borderStrong};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const EstadoTela = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px 0;
`;

export const SkeletonEsteira = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  overflow: hidden;
`;

export const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Anuncio = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
