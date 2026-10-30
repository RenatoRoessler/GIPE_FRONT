"use client";

import styled from "styled-components";
import { PONTOS_SEM_ROLAGEM } from "../regua";

const ALTURA = 200;
const LARGURA_EIXO_Y = 64;
// Largura mínima de cada coluna no celular quando o período tem mais pontos do que cabem na tela.
const LARGURA_COLUNA_CELULAR = 14;

export const Raiz = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Titulo = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Legenda = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[4]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Amostra = styled.span<{ $tom: "success" | "danger" | "accent" }>`
  display: inline-block;
  width: 10px;
  height: ${({ $tom }) => ($tom === "accent" ? "3px" : "10px")};
  margin-right: ${({ theme }) => theme.space[1]}px;
  border-radius: 2px;
  vertical-align: middle;
  background-color: ${({ $tom, theme }) => theme.colors[$tom]};
`;

export const Aviso = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const SemMovimento = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${ALTURA / 2}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

// O gráfico em si: eixo Y fixo à esquerda e a área do desenho ao lado, que rola no celular quando há muitos pontos.
export const Quadro = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${LARGURA_EIXO_Y}px minmax(0, 1fr);
  column-gap: ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.md};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const EixoY = styled.div`
  position: relative;
  height: ${ALTURA}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;
`;

export const MarcaY = styled.span<{ $posicao: number }>`
  position: absolute;
  right: 0;
  top: ${({ $posicao }) => $posicao}%;
  transform: translateY(-50%);
  white-space: nowrap;
`;

export const Rolagem = styled.div`
  overflow-x: auto;
  min-width: 0;
`;

export const Area = styled.div<{ $pontos: number }>`
  position: relative;
  min-width: 0;

  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    min-width: ${({ $pontos }) => ($pontos > PONTOS_SEM_ROLAGEM ? `${$pontos * LARGURA_COLUNA_CELULAR}px` : "0")};
  }
`;

export const Plano = styled.div`
  position: relative;
  height: ${ALTURA}px;
`;

export const LinhaZero = styled.div<{ $posicao: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: ${({ $posicao }) => $posicao}%;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Colunas = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
`;

export const Coluna = styled.div<{ $ativa: boolean }>`
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  cursor: crosshair;
  background-color: ${({ $ativa, theme }) => ($ativa ? theme.colors.surfaceMuted : "transparent")};
`;

// Entradas sobem a partir da linha zero; saídas descem dela.
export const Haste = styled.div<{ $sentido: "entrada" | "saida"; $zero: number; $altura: number }>`
  position: absolute;
  left: 15%;
  right: 15%;
  ${({ $sentido, $zero, $altura }) =>
    $sentido === "entrada"
      ? `bottom: ${100 - $zero}%; height: ${$altura}%;`
      : `top: ${$zero}%; height: ${$altura}%;`}
  min-height: ${({ $altura }) => ($altura > 0 ? "2px" : "0")};
  border-radius: 1px;
  background-color: ${({ $sentido, theme }) => ($sentido === "entrada" ? theme.colors.success : theme.colors.danger)};
`;

export const Linha = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;

  polyline {
    fill: none;
    stroke: ${({ theme }) => theme.colors.accent};
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  polygon {
    fill: ${({ theme }) => theme.colors.dangerSoft};
    stroke: none;
  }
`;

export const Ponto = styled.span<{ $x: number; $y: number }>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  border: 2px solid ${({ theme }) => theme.colors.surface};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.accent};
  pointer-events: none;
`;

export const Balao = styled.div<{ $x: number }>`
  position: absolute;
  top: 0;
  left: clamp(96px, ${({ $x }) => $x}%, calc(100% - 96px));
  transform: translateX(-50%);
  z-index: 2;
  min-width: 176px;
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  pointer-events: none;

  strong {
    display: block;
    margin-bottom: ${({ theme }) => theme.space[1]}px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  dl {
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
    gap: 2px ${({ theme }) => theme.space[3]}px;
    margin: 0;
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    text-align: right;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;

export const EixoX = styled.div`
  position: relative;
  height: 24px;
  margin-top: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Os rótulos das pontas ficam alinhados à borda: centralizados, metade deles sairia da área e seria cortada.
export const MarcaX = styled.span<{ $x: number; $borda?: "inicio" | "fim" }>`
  position: absolute;
  left: ${({ $x, $borda }) => ($borda === "inicio" ? 0 : $borda === "fim" ? "auto" : `${$x}%`)};
  right: ${({ $borda }) => ($borda === "fim" ? 0 : "auto")};
  top: 0;
  transform: ${({ $borda }) => ($borda ? "none" : "translateX(-50%)")};
  white-space: nowrap;
`;

// Anunciado por leitores de tela quando o ponto ativo muda; invisível na tela.
export const Anuncio = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const Detalhes = styled.details`
  font-size: ${({ theme }) => theme.fontSizes.sm};

  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.link};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  table {
    margin-top: ${({ theme }) => theme.space[2]}px;
  }
`;

export const Quieto = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Negativo = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`;
