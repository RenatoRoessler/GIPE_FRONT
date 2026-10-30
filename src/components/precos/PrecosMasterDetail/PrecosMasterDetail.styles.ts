"use client";

import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

// Altura ocupada acima e abaixo da moldura (cabeçalho do app, título da página e margens), para as duas colunas
// caberem na janela e rolarem sozinhas, sem rolar a página junto.
const CROMO = "190px";

// Desktop: duas colunas com altura própria, cada uma rolando sozinha. Celular: uma coluna por vez, conforme
// a tabela esteja ou não no endereço (`$detalheAberto`), sem depender de media query em JavaScript.
export const Moldura = styled.div<{ $detalheAberto: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;

  /* Tablet: a navegação inferior continua fixa, então ela também sai da altura. */
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
    height: calc(100dvh - ${CROMO} - ${({ theme }) => theme.layout.bottomNavHeight} - env(safe-area-inset-bottom, 0px));
    min-height: 440px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    height: calc(100dvh - ${CROMO});
    min-height: 480px;
  }
`;

export const ColunaLista = styled.section<{ $detalheAberto: boolean }>`
  display: ${({ $detalheAberto }) => ($detalheAberto ? "none" : "flex")};
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background-color: ${({ theme }) => theme.colors.surface};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const ColunaDetalhe = styled.section<{ $detalheAberto: boolean }>`
  display: ${({ $detalheAberto }) => ($detalheAberto ? "block" : "none")};
  container-type: inline-size;
  min-width: 0;
  min-height: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
    padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[5]}px;
    overflow-y: auto;
  }
`;

export const Filtros = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const BuscaCampo = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: ${({ theme }) => theme.space[3]}px;
    color: ${({ theme }) => theme.colors.textMuted};
    pointer-events: none;
  }
`;

export const Busca = styled.input`
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  padding-left: ${({ theme }) => theme.space[6]}px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }
`;

// Filtro de situação em chips de um toque; numa linha só, rolando para o lado quando não cabe.
export const Chips = styled.fieldset`
  display: flex;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
  margin: 0 -${({ theme }) => theme.space[3]}px;
  padding: 2px ${({ theme }) => theme.space[3]}px;
  border: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Chip = styled.label<{ $ativo: boolean }>`
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  box-shadow: inset 0 0 0 1px
    ${({ theme, $ativo }) => ($ativo ? theme.colors.accent : theme.colors.borderStrong)};
  background-color: ${({ theme, $ativo }) => ($ativo ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme, $ativo }) => ($ativo ? theme.colors.text : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $ativo }) => ($ativo ? theme.fontWeights.bold : theme.fontWeights.medium)};
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &:has(input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }

  input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
`;

export const Contagem = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Rolagem = styled.div<{ $atualizando: boolean }>`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  opacity: ${({ $atualizando }) => ($atualizando ? 0.6 : 1)};
  transition: opacity 0.15s ease;

  &:focus {
    outline: none;
  }
`;

export const Lista = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Rodape = styled.div`
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const EstadoLista = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
`;

export const SkeletonItens = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
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

const oculto = `
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

export const LegendaOculta = styled.legend`
  ${oculto}
`;

export const RotuloOculto = styled.label`
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
