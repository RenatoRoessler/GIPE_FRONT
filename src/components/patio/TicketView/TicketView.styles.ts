"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

const desktop = ({ theme }: { theme: { breakpoints: { md: string } } }) => `@media (min-width: ${theme.breakpoints.md})`;

// Celular: uma coluna. Computador: veículo e destaques à esquerda; itens e ações à direita.
export const Colunas = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;

  ${desktop} {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: ${({ theme }) => theme.space[4]}px;
    align-items: start;
  }
`;

export const Coluna = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
`;

export const VeiculoBloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const PlacaGrande = styled.b`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.04em;
  line-height: 1.1;
`;

export const Descricao = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

export const Destaques = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Destaque = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  dd {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
  }
`;

export const TentarValor = styled.button`
  align-self: flex-start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.link};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Itens = styled.dl`
  margin: 0;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space[2]}px 0;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:last-child {
    border-bottom: 0;
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[2]}px;
    min-width: 0;
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-align: right;
    overflow-wrap: anywhere;
  }
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
`;

// Etiqueta do gancho: o preenchimento amarelo da marca.
export const Gancho = styled.span`
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  line-height: 1;
`;

export const ForaDoQuadro = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const PontoAtencao = styled.span`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.warn};
`;

export const LinkBotao = styled.button`
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space[1]}px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.link};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Aviso = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// Celular: as ações ficam coladas acima do menu inferior, com o conteúdo rolando por trás.
export const Acoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (max-width: calc(${({ theme }) => theme.breakpoints.md} - 1px)) {
    position: sticky;
    bottom: calc(${({ theme }) => theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px));
    z-index: 10;
    margin: 0 -${({ theme }) => theme.space[3]}px;
    padding: ${({ theme }) => theme.space[3]}px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.surface};
  }
`;

export const SaidaBotao = styled(Button)`
  min-height: 56px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

export const QrBotao = styled(Button)`
  min-height: 48px;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.borderStrong};
`;

export const Estado = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[4]}px;
  text-align: center;

  b {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  }

  p {
    max-width: 320px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;
