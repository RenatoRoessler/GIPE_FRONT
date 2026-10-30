"use client";

import NextLink from "next/link";
import styled from "styled-components";
import { Button } from "@/components/ui/Button";

// Abaixo de `breakpoints.md` os blocos empilham e os alvos de toque chegam a 44px.
const mobile = ({ theme }: { theme: { breakpoints: { md: string } } }) => `@media (max-width: ${parseInt(theme.breakpoints.md, 10) - 1}px)`;
const desktop = ({ theme }: { theme: { breakpoints: { md: string } } }) => `@media (min-width: ${theme.breakpoints.md})`;

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
`;

// ---------- Topo ----------

export const Topo = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]}px;

  /* No celular o topo (título, estacionamento e hora) some da vista, mas continua para o leitor de tela. */
  ${mobile} {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
`;

// Hora e, em telas grandes, as ações de entrada e saída. Abaixo de `lg` quem faz isso é a barra de navegação inferior.
export const Lado = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const AcoesTopo = styled.div`
  display: none;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
  }
`;

export const Titulo = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.subtitle};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  line-height: 1.1;
`;

export const Subtitulo = styled.p`
  margin: ${({ theme }) => theme.space[1]}px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Hora = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-variant-numeric: tabular-nums;
`;

// ---------- Resumo ----------

export const ResumoGrade = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[3]}px;
  align-items: stretch;

  /* Computador: ocupação, tipos e, no terceiro bloco, busca e filtros. */
  ${desktop} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr);
  }
`;

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const Rotulo = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Ocupacao = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-variant-numeric: tabular-nums;

  b {
    color: ${({ theme }) => theme.colors.accent};
    font-size: ${({ theme }) => theme.fontSizes.xxl};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    letter-spacing: -0.04em;
    line-height: 1;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
`;

export const Barra = styled.div`
  height: 6px;
  margin-top: auto;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const BarraPreenchimento = styled.i<{ $percentual: number }>`
  display: block;
  width: ${({ $percentual }) => Math.min(Math.max($percentual, 0), 100)}%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.sm};
  background-color: ${({ theme }) => theme.colors.text};
  transition: width 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const Livres = styled.span`
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const DetalheVagas = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Tipos = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

// Cada tipo é também um filtro da lista; tocar de novo o desfaz.
export const TipoLinha = styled.button<{ $ativo: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: 44px;
  margin: 0;
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $ativo }) => ($ativo ? theme.colors.primarySoft : "transparent")};
  box-shadow: ${({ theme, $ativo }) => ($ativo ? `inset 0 0 0 1.5px ${theme.colors.accent}` : "none")};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: left;
  cursor: pointer;

  b {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.accent};
    font-weight: ${({ theme }) => theme.fontWeights.extrabold};
    font-variant-numeric: tabular-nums;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Bola = styled.span<{ $tipo: "avulso" | "mensal" }>`
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme, $tipo }) => theme.colors.cliente[$tipo]};
`;

// ---------- Busca e filtros ----------

export const BarraFiltros = styled.div`
  display: grid;
  grid-column: 1 / -1;
  align-content: start;
  gap: ${({ theme }) => theme.space[3]}px;

  ${desktop} {
    grid-column: auto;
    padding: ${({ theme }) => theme.space[3]}px;
    border-radius: ${({ theme }) => theme.radii.xl};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  }
`;

export const LinhaBusca = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const BuscaCampo = styled.label`
  display: flex;
  flex: 1;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
  height: 48px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1.5px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMuted};

  svg {
    flex: none;
  }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: ${({ theme }) => theme.fontSizes.md};

    &::placeholder {
      color: ${({ theme }) => theme.colors.textMuted};
    }
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 1px;
  }
`;

export const SomenteLeitor = styled.span`
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

export const FiltrosBotao = styled(Button)`
  min-height: 48px;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  /* No computador o painel está sempre aberto; no celular o botão não aparece. */
  ${desktop} {
    display: none;
  }

  ${mobile} {
    display: none;
  }
`;

export const PainelFiltros = styled.div<{ $aberto: boolean }>`
  display: ${({ $aberto }) => ($aberto ? "grid" : "none")};
  gap: ${({ theme }) => theme.space[3]}px;

  ${desktop} {
    display: grid;
  }
`;

// Categorias e chave no quadro: dois grupos que dividem a mesma linha quando há espaço e quebram quando não há.
export const LinhaChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  strong {
    color: ${({ theme }) => theme.colors.link};
    font-variant-numeric: tabular-nums;
  }

  &[aria-pressed="true"] {
    background-color: ${({ theme }) => theme.colors.primarySoft};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const LimparFiltros = styled(Button)`
  align-self: flex-start;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  ${mobile} {
    min-height: 44px;
  }
`;

// ---------- Atualização ----------

export const Atualizacao = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};

  /* No celular a linha (contagem, hora da atualização e botão) some: a lista se atualiza sozinha. */
  ${mobile} {
    display: none;
  }
`;

export const AtualizarBotao = styled(Button)`
  /* O secundário tem o fundo da página e sumiria: ganha um contorno. */
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  ${mobile} {
    min-height: 44px;
  }
`;

export const Indicadores = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// ---------- Lista ----------

export const Grade = styled.ul<{ $atualizando: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  opacity: ${({ $atualizando }) => ($atualizando ? 0.6 : 1)};
  transition: opacity 0.15s ease;

  ${desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.space[3]}px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CardLink = styled(NextLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  height: 100%;
  padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;

  &:hover,
  &:active {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CardCorpo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const CardLinha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const Placa = styled.b`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.03em;
  line-height: 1.2;
`;

export const Permanencia = styled.b`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

export const Veiculo = styled.span`
  min-width: 0;
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const Legenda = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  white-space: nowrap;
`;

export const CardRodape = styled(CardLinha)`
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: ${({ theme }) => theme.space[2]}px;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

export const Entrada = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Seta = styled.span`
  display: inline-flex;
  flex: none;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const MaisBotao = styled(Button)`
  align-self: flex-start;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  ${mobile} {
    min-height: 44px;
  }
`;

// ---------- Vazio, carregamento e gráficos ----------

export const Vazio = styled.div`
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
    max-width: 280px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

// Vaga vazia: retângulo aberto embaixo.
export const VagaIcone = styled.span`
  width: 56px;
  height: 48px;
  border: 4px solid ${({ theme }) => theme.colors.border};
  border-bottom: 0;
  border-radius: ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0 0;
`;

export const EsqueletoLinha = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const GraficosDetalhes = styled.details`
  ${mobile} {
    display: none;
  }

  summary {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 ${({ theme }) => theme.space[4]}px;
    border-radius: ${({ theme }) => theme.radii.md};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.focus};
      outline-offset: 2px;
    }
  }
`;

export const GraficosGrade = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  margin-top: ${({ theme }) => theme.space[3]}px;

  /* O gráfico de chegadas é o último e ocupa a linha toda. */
  ${desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > :last-child {
      grid-column: 1 / -1;
    }
  }
`;

// Anúncio para leitor de tela; não aparece na tela.
export const Anuncio = SomenteLeitor;
