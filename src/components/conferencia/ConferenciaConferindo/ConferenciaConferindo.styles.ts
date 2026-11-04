"use client";

import styled from "styled-components";
import { COLUNA_MAX, Rodape } from "../Conferencia.styles";

// Celular e telas médias: uma coluna. Em telas grandes, o progresso e a câmera ficam fixos à esquerda e a lista rola à direita.
export const Tela = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: ${COLUNA_MAX};
  margin: 0 auto;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: grid;
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    grid-template-areas:
      "topo topo"
      "painel lista"
      "acoes lista";
    align-items: start;
    max-width: none;
    gap: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[5]}px;
  }
`;

export const Topo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-area: topo;
  }
`;

export const Painel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-area: painel;
    position: sticky;
    top: ${({ theme }) => theme.layout.stickyTop};
  }
`;

export const Lista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-area: lista;
  }
`;

export const Progresso = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const ProgressoLinha = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const ProgressoTexto = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  font-variant-numeric: tabular-nums;
`;

export const Percentual = styled.span`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Filtros = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Filtro = styled.button<{ $alerta?: boolean }>`
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  box-shadow: inset 0 0 0 1.5px ${({ theme, $alerta }) => ($alerta ? theme.colors.danger : theme.colors.borderStrong)};
  color: ${({ theme, $alerta }) => ($alerta ? theme.colors.danger : theme.colors.text)};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  cursor: pointer;

  &[aria-pressed="true"] {
    background-color: ${({ theme }) => theme.colors.text};
    box-shadow: none;
    color: ${({ theme }) => theme.colors.background};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Itens = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ListaVazia = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[3]}px;
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// No computador as ações ficam sob o painel, na coluna da esquerda, em vez de presas ao rodapé da tela.
export const Acoes = styled(Rodape)`
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-area: acoes;
  }
`;
