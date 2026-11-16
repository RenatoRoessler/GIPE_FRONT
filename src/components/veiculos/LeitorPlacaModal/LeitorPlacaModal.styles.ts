"use client";

import styled from "styled-components";

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Visor = styled.div<{ $tom?: "neutro" | "ok" | "duvida" }>`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid
    ${({ theme, $tom = "neutro" }) => ($tom === "ok" ? theme.colors.success : $tom === "duvida" ? theme.colors.warn : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

// A placa é procurada no quadro inteiro; a moldura só enquadra o visor, como no leitor de QR.
export const Moldura = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
`;

export const Mensagem = styled.p`
  margin: 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Aviso pequeno sobre a imagem da câmera enquanto o leitor de placas ainda carrega.
export const Pilula = styled.span`
  position: absolute;
  bottom: ${({ theme }) => theme.space[2]}px;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
  pointer-events: none;
`;

export const Conferencia = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
`;

export const PlacaLida = styled.div`
  width: min(240px, 100%);
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Placa lida com dúvida: o caractere que variou entre os quadros fica destacado e dito em texto, não só pela cor.
export const Duvida = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`;

export const CaractereEmDuvida = styled.mark`
  padding: 0 ${({ theme }) => theme.space[1]}px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.warn};
  color: ${({ theme }) => theme.colors.onWarn};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;
