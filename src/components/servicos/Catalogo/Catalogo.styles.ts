"use client";

import styled, { css } from "styled-components";
import { lightTheme } from "@/styles/theme";

// Os estilos do catálogo de serviços (lista e cadastro), do protótipo "Murel Serviços". As cores vêm do tema; o azul-noite
// do protótipo é o `onPrimary` (o mesmo asfalto que escreve sobre o amarelo) e o giz sobre ele é o fundo do tema claro.
export const GIZ = lightTheme.colors.background;
// O giz mais apagado, para o texto de apoio sobre o azul-noite.
export const GIZ_SUAVE = "#C9CEDA";

// O texto de apoio forte do protótipo (--fg-2): entre o texto e o texto apagado.
export const fg2 = css`color-mix(in srgb, ${({ theme }) => theme.colors.text} 78%, ${({ theme }) => theme.colors.background})`;
export const verdeSuave = css`color-mix(in srgb, ${({ theme }) => theme.colors.success} 16%, ${({ theme }) => theme.colors.surface})`;
export const amareloSuave = css`color-mix(in srgb, ${({ theme }) => theme.colors.primary} 22%, transparent)`;
export const amarelo = css`${({ theme }) => theme.colors.primary}`;

export const Eyebrow = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
`;

export const Mono = Eyebrow;

// A coluna de 760px do protótipo, centrada.
export const Coluna = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  min-width: 0;
`;

export const Cab = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;

  h1 {
    margin: 2px 0 0;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.15;
    text-wrap: balance;
  }
`;

export const Botao = styled.button<{ $tipo?: "primario" | "perigo" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  padding: 0 20px;
  border: 1px solid ${({ theme, $tipo }) => ($tipo === "primario" ? "transparent" : $tipo === "perigo" ? theme.colors.danger : theme.colors.border)};
  border-radius: 12px;
  background-color: ${({ theme, $tipo }) => ($tipo === "primario" ? theme.colors.primary : $tipo === "perigo" ? theme.colors.danger : theme.colors.surface)};
  color: ${({ theme, $tipo }) => ($tipo === "primario" ? theme.colors.onPrimary : $tipo === "perigo" ? theme.colors.onDanger : theme.colors.text)};
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme, $tipo }) => ($tipo === "primario" ? theme.colors.primaryHover : theme.colors.textMuted)};
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

export const Busca = styled.label<{ $celular?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  height: ${({ $celular }) => ($celular ? 50 : 48)}px;
  padding: 0 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ $celular }) => ($celular ? 14 : 12)}px;
  background-color: ${({ theme }) => theme.colors.surface};

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: none;
    color: inherit;
    font: inherit;
    font-size: ${({ $celular }) => ($celular ? 16 : 15)}px;

    &::placeholder {
      color: ${({ theme }) => theme.colors.textMuted};
    }
  }

  svg {
    flex: none;
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const SrApenas = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

export const Resumo = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Chip = styled.li`
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${fg2};
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

export const Lista = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Icone = styled.div<{ $tamanho?: number }>`
  display: grid;
  flex: none;
  place-items: center;
  width: ${({ $tamanho = 42 }) => $tamanho}px;
  height: ${({ $tamanho = 42 }) => $tamanho}px;
  border-radius: ${({ $tamanho = 42 }) => ($tamanho > 42 ? 13 : 12)}px;
  background-color: ${({ theme }) => theme.colors.onPrimary};
  color: ${amarelo};

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const Cartao = styled.button`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.surface};
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const CartaoTopo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;

  > div:last-child {
    min-width: 0;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.2px;
  }

  p {
    display: -webkit-box;
    margin: 2px 0 0;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 13px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;

export const CartaoInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const Etiqueta = styled.span<{ $tipo?: "gratis" | "fora" }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 8px;
  background-color: ${({ theme, $tipo }) => ($tipo === "gratis" ? verdeSuave : $tipo === "fora" ? theme.colors.dangerSoft : theme.colors.surfaceMuted)};
  color: ${({ theme, $tipo }) => ($tipo === "gratis" ? theme.colors.success : $tipo === "fora" ? theme.colors.danger : fg2)};
  font-size: 12px;
  font-weight: 600;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const CartaoPreco = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};

  small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 12px;
    font-weight: 600;
  }

  .v {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }
`;

export const Vazio = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.surface};
  text-align: center;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }

  p {
    max-width: 40ch;
    margin: 0 0 8px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Flutuante = styled.button`
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + 20px + env(safe-area-inset-bottom, 0px));
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 58px;
  padding: 0 22px;
  border: 0;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  box-shadow: 0 8px 20px rgba(14, 23, 41, 0.3);
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// A aviso de "Serviço cadastrado": caixa azul-noite com a barra amarela à esquerda.
export const Aviso = styled.div`
  position: fixed;
  left: 50%;
  bottom: 32px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
  padding: 12px 18px;
  border-left: 4px solid ${amarelo};
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.onPrimary};
  color: ${GIZ};
  font-size: 14px;
  font-weight: 700;
  transform: translateX(-50%);

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 767px) {
    bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + 20px + env(safe-area-inset-bottom, 0px));
    border-radius: 14px;
  }
`;
