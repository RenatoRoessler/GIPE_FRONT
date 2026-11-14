"use client";

import styled, { css } from "styled-components";
import { amarelo, amareloSuave, fg2, GIZ, GIZ_SUAVE, verdeSuave } from "./Catalogo.styles";

// A tela cheia do cadastro no celular: cobre o menu do app, como o protótipo (barra azul-noite própria no topo, ação
// principal presa embaixo).
export const Tela = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

export const Topo = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 4px solid ${amarelo};
  background-color: ${({ theme }) => theme.colors.onPrimary};
  color: ${GIZ};
`;

export const TopoLinha = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 0 max(12px, env(safe-area-inset-right, 0px)) 0 max(12px, env(safe-area-inset-left, 0px));

  h1 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.3px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .passo {
    color: ${amarelo};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
`;

export const BotaoDoTopo = styled.button`
  display: grid;
  flex: none;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 12px;
  background: none;
  color: inherit;
  cursor: pointer;

  &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:focus-visible {
    outline: 2px solid ${amarelo};
    outline-offset: 2px;
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const Progresso = styled.div`
  display: flex;
  gap: 6px;
  padding: 0 max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px));

  span {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    background-color: rgba(255, 255, 255, 0.18);
  }

  span.on {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Principal = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  padding: 16px max(16px, env(safe-area-inset-right, 0px)) 24px max(16px, env(safe-area-inset-left, 0px));
`;

export const Barra = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 18;
  display: flex;
  gap: 10px;
  padding: 12px max(16px, env(safe-area-inset-right, 0px)) calc(12px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const BotaoCelular = styled.button<{ $tipo?: "primario" | "perigo" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  height: 52px;
  padding: 0 18px;
  border: 1.5px solid ${({ theme, $tipo }) => ($tipo === "primario" ? "transparent" : $tipo === "perigo" ? theme.colors.danger : theme.colors.border)};
  border-radius: 14px;
  background-color: ${({ theme, $tipo }) => ($tipo === "primario" ? theme.colors.primary : $tipo === "perigo" ? theme.colors.danger : theme.colors.surface)};
  color: ${({ theme, $tipo }) => ($tipo === "primario" ? theme.colors.onPrimary : $tipo === "perigo" ? theme.colors.onDanger : theme.colors.text)};
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;

  &:active:not(:disabled) {
    ${({ theme, $tipo }) => $tipo === "primario" && `background-color: ${theme.colors.primaryHover};`}
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const Titulo = styled.div`
  h2 {
    margin: 2px 0 0;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.15;
    text-wrap: balance;
  }

  .sub {
    margin: 4px 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 14px;
  }
`;

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label,
  .lbl {
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
  height: ${({ $altura = 52 }) => $altura}px;
  padding: 0 14px;
  border: 1.5px solid ${({ theme, $invalido }) => ($invalido ? theme.colors.danger : theme.colors.border)};
  border-radius: 14px;
  outline: none;
  background-color: ${({ theme }) => theme.colors.surface};
  color: inherit;
  font: inherit;
  font-size: 16px;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme, $invalido }) => ($invalido ? theme.colors.danger : theme.colors.accent)};
    box-shadow: 0 0 0 3px ${amareloSuave};
  }
`;

export const AreaDeTexto = styled.textarea`
  width: 100%;
  min-height: 84px;
  padding: 12px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  outline: none;
  background-color: ${({ theme }) => theme.colors.surface};
  color: inherit;
  font: inherit;
  font-size: 16px;
  resize: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${amareloSuave};
  }
`;

export const Ajuda = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
`;

export const Erro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 13px;
  font-weight: 700;
`;

// Chips de rolagem horizontal que vazam as margens da tela, como no protótipo.
export const Chips = styled.div`
  display: flex;
  gap: 8px;
  margin: 0 calc(-1 * max(16px, env(safe-area-inset-right, 0px))) 0 calc(-1 * max(16px, env(safe-area-inset-left, 0px)));
  padding: 2px max(16px, env(safe-area-inset-right, 0px)) 2px max(16px, env(safe-area-inset-left, 0px));
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

// O chip marcado: azul-noite com texto amarelo no tema claro; amarelo com texto azul-noite no escuro.
const marcado = css`
  border-color: ${({ theme }) => theme.colors.accent};
  background-color: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => (theme.colors.accent === theme.colors.onPrimary ? amarelo : theme.colors.onPrimary)};
`;

export const Chip = styled.button<{ $marcado?: boolean }>`
  flex: none;
  height: 38px;
  padding: 0 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${fg2};
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  ${({ $marcado }) => $marcado && marcado}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Contador = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${fg2};
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  .perigo {
    color: ${({ theme }) => theme.colors.danger};
  }

  .ok {
    color: ${({ theme }) => theme.colors.success};
  }
`;

export const Categorias = styled.div`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export type EstadoDaCategoria = "normal" | "pronta" | "falta" | "fora";

export const CategoriaBotao = styled.button<{ $estado: EstadoDaCategoria }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:first-child {
    border-top: 0;
  }

  &:active {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -2px;
  }

  .cico {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background-color: ${({ theme, $estado }) => ($estado === "pronta" ? verdeSuave : theme.colors.surfaceMuted)};
    color: ${({ theme, $estado }) => ($estado === "pronta" ? theme.colors.success : fg2)};

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .txt {
    flex: 1;
    min-width: 0;
  }

  strong {
    display: block;
    color: ${({ theme, $estado }) => ($estado === "fora" ? theme.colors.textMuted : "inherit")};
    font-size: 15px;
    font-weight: 800;
    text-decoration: ${({ $estado }) => ($estado === "fora" ? "line-through" : "none")};
  }

  .res {
    display: block;
    margin-top: 1px;
    color: ${({ theme, $estado }) => ($estado === "falta" ? theme.colors.danger : theme.colors.textMuted)};
    font-size: 13px;
    font-weight: ${({ $estado }) => ($estado === "falta" ? 700 : 400)};
    font-variant-numeric: tabular-nums;
  }

  .seta {
    flex: none;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Revisao = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const LinhaDaRevisao = styled.div<{ $fora?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
  padding-top: 10px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};

  &:first-of-type {
    padding-top: 0;
    border-top: 0;
  }

  b {
    color: ${({ theme, $fora }) => ($fora ? theme.colors.textMuted : "inherit")};
    font-size: 14px;
    text-decoration: ${({ $fora }) => ($fora ? "line-through" : "none")};
  }

  .v {
    color: ${({ theme, $fora }) => ($fora ? theme.colors.textMuted : "inherit")};
    font-weight: ${({ $fora }) => ($fora ? 400 : 800)};
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  small {
    grid-column: 1 / -1;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 12.5px;
  }
`;

export const Link = styled.button<{ $perigo?: boolean }>`
  align-self: flex-start;
  padding: 8px 0;
  border: 0;
  background: none;
  color: ${({ theme, $perigo }) => ($perigo ? theme.colors.danger : fg2)};
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`;

export const Cliente = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
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

  .seg {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .seg button {
    flex: none;
    height: 32px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    background: none;
    color: ${GIZ_SUAVE};
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .seg button.on {
    border-color: ${amarelo};
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  }

  .msg {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px;
    border-radius: 14px;
    background-color: rgba(255, 255, 255, 0.06);
  }

  .msg h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
  }

  .msg p {
    margin: 0;
    color: ${GIZ_SUAVE};
    font-size: 14px;
  }

  .msg .v {
    color: ${amarelo};
    font-size: 22px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
`;
