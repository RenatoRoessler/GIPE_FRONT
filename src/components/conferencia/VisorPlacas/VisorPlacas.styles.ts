"use client";

import styled from "styled-components";
import { darkTheme } from "@/styles/theme";

// Equipamento: o visor é escuro nos dois temas, como o do leitor de QR; as cores vêm do tema escuro.
const visor = darkTheme.colors;

export const Visor = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: 176px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${visor.background};
  color: ${visor.text};
`;

// Cantos de enquadramento por cima do vídeo; não recebem toque.
export const Moldura = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
`;

export const Conteudo = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  padding: ${({ theme }) => theme.space[4]}px;
  text-align: center;

  & button {
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }
`;

export const PlacaLida = styled.div`
  width: min(180px, 70%);
`;

export const Mensagem = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.4;
`;

export const Resultado = styled.p<{ $tom: "success" | "muted" | "danger" }>`
  margin: 0;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${visor.surface};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ $tom }) => ($tom === "success" ? visor.success : $tom === "danger" ? visor.danger : visor.textMuted)};
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]}px;

  & > button {
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;
