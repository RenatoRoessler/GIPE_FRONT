"use client";

import styled from "styled-components";

export const Raiz = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: -${({ theme }) => theme.space[4]}px;
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
  min-height: ${({ theme }) => theme.layout.touchTarget};
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

// Filtro de situação em chips de um toque; quebram de linha para nenhuma opção ficar escondida na borda da tela.
export const Chips = styled.fieldset`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
  margin: 0;
  padding: 2px 0;
  border: 0;
`;

export const Chip = styled.label<{ $ativo: boolean }>`
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  box-shadow: inset 0 0 0 1px ${({ theme, $ativo }) => ($ativo ? theme.colors.accent : theme.colors.borderStrong)};
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
  ${oculto}
`;
