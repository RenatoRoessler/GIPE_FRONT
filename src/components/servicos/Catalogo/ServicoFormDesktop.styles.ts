"use client";

import styled from "styled-components";
import { amarelo, amareloSuave, fg2, GIZ, GIZ_SUAVE } from "./Catalogo.styles";

export const Voltar = styled.button`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: ${fg2};
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 18px;
    height: 18px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const TituloDaSecao = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .n {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.colors.onPrimary};
    color: ${amarelo};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: 12px;
  }

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
  }
`;

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  label {
    color: ${fg2};
    font-size: 13px;
    font-weight: 700;
  }

  .opc {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 500;
  }
`;

export const Entrada = styled.input<{ $invalido?: boolean; $altura?: number }>`
  width: 100%;
  height: ${({ $altura = 48 }) => $altura}px;
  padding: 0 14px;
  border: 1.5px solid ${({ theme, $invalido }) => ($invalido ? theme.colors.danger : theme.colors.border)};
  border-radius: 12px;
  outline: none;
  background-color: ${({ theme }) => theme.colors.surface};
  color: inherit;
  font: inherit;
  font-size: 16px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme, $invalido }) => ($invalido ? theme.colors.danger : theme.colors.accent)};
    box-shadow: 0 0 0 3px ${amareloSuave};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

export const AreaDeTexto = styled.textarea`
  width: 100%;
  min-height: 76px;
  padding: 12px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  outline: none;
  background-color: ${({ theme }) => theme.colors.surface};
  color: inherit;
  font: inherit;
  font-size: 16px;
  resize: vertical;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${amareloSuave};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

export const Ajuda = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12.5px;
`;

export const Erro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 13px;
  font-weight: 600;
`;

export const Contador = styled.div`
  margin-top: -2px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

export const Modelos = styled.div`
  display: flex;
  gap: 8px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: none;

  button {
    flex: none;
    height: 34px;
    padding: 0 12px;
    border: 1px dashed ${({ theme }) => theme.colors.border};
    border-radius: 999px;
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${fg2};
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.primaryHover};
      color: ${({ theme }) => theme.colors.text};
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.focus};
      outline-offset: 2px;
    }
  }
`;

export const LinhaDaSecao = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: -6px;
`;

export const Copiar = styled.button`
  height: 34px;
  padding: 0 12px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${fg2};
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primaryHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Categorias = styled.div`
  display: flex;
  flex-direction: column;
`;

const COLUNAS = "minmax(0, 1fr) 330px 44px";
const CAMPOS = "minmax(0, 1fr) 92px 92px";

export const CabecalhoDasColunas = styled.div`
  display: grid;
  grid-template-columns: ${COLUNAS};
  gap: 12px;
  padding: 0 0 6px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 700;

  > div {
    display: grid;
    grid-template-columns: ${CAMPOS};
    gap: 8px;
  }
`;

export const LinhaDaCategoria = styled.div<{ $fora: boolean }>`
  display: grid;
  grid-template-columns: ${COLUNAS};
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  &:first-of-type {
    border-top: 0;
  }

  .nome {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    color: ${({ theme, $fora }) => ($fora ? theme.colors.textMuted : theme.colors.text)};
    font-size: 14px;
    font-weight: 700;

    svg {
      flex: none;
      width: 22px;
      height: 22px;
      color: ${({ theme }) => theme.colors.textMuted};
      opacity: ${({ $fora }) => ($fora ? 0.5 : 1)};
    }

    small {
      display: block;
      color: ${({ theme }) => theme.colors.textMuted};
      font-size: 12px;
      font-weight: 500;
    }
  }

  .vals {
    display: grid;
    grid-template-columns: ${CAMPOS};
    gap: 8px;
    align-items: end;
    min-width: 0;
  }
`;

// Prefixo "R$" ou sufixo "min" dentro do campo.
export const ComAfixo = styled.div<{ $lado: "prefixo" | "sufixo" }>`
  position: relative;
  min-width: 0;

  input {
    ${({ $lado }) => ($lado === "prefixo" ? "padding-left: 42px; font-variant-numeric: tabular-nums; font-weight: 700;" : "padding-right: 36px; padding-left: 10px; font-variant-numeric: tabular-nums;")}
  }

  span {
    position: absolute;
    top: 50%;
    ${({ $lado }) => ($lado === "prefixo" ? "left: 14px; font-size: 14px; font-weight: 700;" : "right: 10px; font-size: 12px; font-weight: 600;")}
    color: ${({ theme }) => theme.colors.textMuted};
    pointer-events: none;
    transform: translateY(-50%);
  }
`;

export const NaoFaz = styled.span`
  display: grid;
  grid-column: 1 / -1;
  place-items: center;
  height: 44px;
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  font-weight: 700;
  text-align: center;
`;

export const Interruptor = styled.button`
  position: relative;
  flex: none;
  width: 44px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.border};
  cursor: pointer;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.surface};
    box-shadow: 0 1px 2px rgba(14, 23, 41, 0.3);
    transition: left 0.15s;
  }

  &[aria-checked="true"] {
    background-color: ${({ theme }) => theme.colors.success};
  }

  &[aria-checked="true"]::after {
    left: 21px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Previa = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.onPrimary};
  color: ${GIZ};

  .rotulo {
    color: ${amarelo};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .linha {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};

    svg {
      width: 22px;
      height: 22px;
    }
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: ${GIZ_SUAVE};
    font-size: 13px;
  }

  .v {
    margin-left: auto;
    font-size: 18px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;

    small {
      display: block;
      color: ${GIZ_SUAVE};
      font-size: 11px;
      font-weight: 600;
    }
  }
`;

export const Inativar = styled.button`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 8px 0;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.danger};
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  svg {
    width: 18px;
    height: 18px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

export const Acoes = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
