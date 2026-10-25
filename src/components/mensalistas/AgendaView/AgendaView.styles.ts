"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

// Abaixo de `breakpoints.md` o item vira duas linhas e os alvos de toque chegam a 44px.
const mobile = ({ theme }: { theme: { breakpoints: { md: string } } }) => `@media (max-width: calc(${theme.breakpoints.md} - 1px))`;

export const Resumo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;

// A frase longa vale no computador; no celular cabe a curta, em uma linha.
export const ResumoLongo = styled.span`
  ${mobile} {
    display: none;
  }
`;

export const ResumoCurto = styled.span`
  display: none;

  ${mobile} {
    display: inline;
  }
`;

export const Grupos = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]}px;
`;

export const GrupoSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const GrupoTitulo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-bottom: ${({ theme }) => theme.space[2]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  &:focus-visible,
  h3:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Contagem = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Item = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "nome acao"
    "info acao";
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[1]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 132px minmax(0, 1.5fr) minmax(0, 1fr) 104px auto;
    grid-template-areas: none;
    gap: ${({ theme }) => theme.space[3]}px;
  }
`;

export const Nome = styled.div`
  grid-area: nome;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-area: auto;
    grid-column: 2;
    grid-row: 1;
  }
`;

// O nome é o botão que abre a ficha, sem aparência de botão.
export const NomeBotao = styled.button`
  display: block;
  max-width: 100%;
  min-height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  ${mobile} {
    min-height: 44px;
  }
`;

export const Sub = styled.span`
  display: block;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Tipo e categoria: só no computador.
export const SubTipo = styled(Sub)`
  ${mobile} {
    display: none;
  }
`;

// No computador os três filhos viram colunas do item; no celular formam a segunda linha.
export const Info = styled.div`
  grid-area: info;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: contents;
  }
`;

export const Vencimento = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  /* No celular o vencimento ocupa a primeira linha de baixo do nome; placa e valor dividem a seguinte. */
  order: 1;
  flex-basis: 100%;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: 1;
    grid-row: 1;
    flex-direction: column;
    align-items: flex-start;
    order: 0;
  }
`;

export const Data = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

export const Complemento = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Placas = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  order: 2;
  min-width: 0;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: 3;
    grid-row: 1;
    order: 0;
  }
`;

export const Valor = styled.span`
  order: 3;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: 4;
    grid-row: 1;
    order: 0;
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    text-align: right;
  }
`;

export const Acao = styled.div`
  grid-area: acao;
  display: flex;
  justify-content: flex-end;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-area: auto;
    grid-column: 5;
    grid-row: 1;
  }
`;

export const AcaoBotao = styled(Button)<{ $contorno?: boolean }>`
  white-space: nowrap;

  /* O secundário tem o fundo da página e sumiria numa lista: ganha um contorno. */
  ${({ $contorno, theme }) => ($contorno ? `box-shadow: inset 0 0 0 1px ${theme.colors.border};` : "")}

  ${mobile} {
    min-height: 44px;
  }
`;

export const MaisBotao = styled(Button)`
  align-self: flex-start;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  ${mobile} {
    min-height: 44px;
  }
`;

export const Conteudo = styled.div<{ $refreshing: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  transition: opacity 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Barra = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

export const Busca = styled.div`
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 320px;
  }
`;

// Linha tracejada de quem não precisa de ação agora.
export const EmDia = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Nota = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

// Anúncio para leitor de tela; não aparece na tela.
export const Anuncio = styled.span`
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
