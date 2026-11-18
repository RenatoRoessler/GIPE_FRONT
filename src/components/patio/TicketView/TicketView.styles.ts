"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";

const desktop = ({ theme }: { theme: { breakpoints: { md: string } } }) => `@media (min-width: ${theme.breakpoints.md})`;

// Celular: uma coluna. Computador: veículo e valor à esquerda; detalhes e serviços à direita.
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

// Cartão do veículo: só contorno; a placa é o rosto e a permanência fecha o cartão.
export const VeiculoCartao = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const PlacaLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const PlacaGrande = styled.b`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.06em;
  line-height: 1.1;
`;

export const Descricao = styled.span`
  margin-top: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

export const PermanenciaLinha = styled.dl`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: ${({ theme }) => theme.space[3]}px 0 0;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};

  dt {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[1]}px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  dd {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;

// Valor até agora: o único bloco com cor. Âmbar só quando há o que cobrar; neutro (mesmas medidas) no resto.
export const ValorCartao = styled.dl<{ $destaque: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ $destaque, theme }) => ($destaque ? theme.colors.warnSoft : "transparent")};
  box-shadow: inset 0 0 0 1px ${({ $destaque, theme }) => ($destaque ? theme.colors.warn : theme.colors.border)};

  dt {
    color: ${({ $destaque, theme }) => ($destaque ? theme.colors.accent : theme.colors.textMuted)};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  dd {
    margin: 0;
  }

  /* O valor; os dd seguintes são apoio (divisão do total, tentar de novo), cada um numa linha. */
  dd:first-of-type {
    margin-left: auto;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
`;

// Linha de apoio do valor (dd): como o total se divide ou o "Tentar novamente", abaixo do total.
export const Apoio = styled.dd`
  flex-basis: 100%;
  text-align: right;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
`;

// Serviço ainda não pronto: só informa, a saída continua liberada.
export const Pendencia = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.warn};
  }
`;

export const TentarValor = styled.button`
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
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
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

// Rodapé fixo do popup (o footer do Modal): filho único que ocupa a largura toda. Celular: tudo empilhado.
// Computador: o aviso numa linha e os dois botões lado a lado, a saída por último.
export const AcoesRodape = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Botoes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  ${desktop} {
    flex-direction: row;

    & > * {
      flex: 1;
    }
  }
`;

export const SaidaBotao = styled(Button)`
  min-height: 56px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

export const QrBotao = styled(Button)`
  gap: ${({ theme }) => theme.space[2]}px;
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
