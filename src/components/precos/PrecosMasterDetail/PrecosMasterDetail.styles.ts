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

// Desktop: duas colunas com altura própria, cada uma rolando sozinha. Celular: uma coluna por vez, conforme
// a tabela esteja ou não no endereço (`$detalheAberto`), sem depender de media query em JavaScript.
export const Moldura = styled.div<{ $detalheAberto: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    height: calc(100dvh - 190px);
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

export const Busca = styled.input`
  width: 100%;
  min-height: 44px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
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
