"use client";

import styled from "styled-components";
import { MOLDURA_LARGURA, MOLDURA_PROPORCAO } from "./useLeitorPlaca";

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Visor = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

// Área da imagem que o OCR lê; as mesmas medidas recortam o quadro em useLeitorPlaca.
export const Moldura = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: ${MOLDURA_LARGURA * 100}%;
  aspect-ratio: ${MOLDURA_PROPORCAO};
  transform: translate(-50%, -50%);
`;

export const Mensagem = styled.p`
  margin: 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
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
