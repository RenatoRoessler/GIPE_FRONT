"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";
import { TableRow } from "@/components/ui/Table";

// Abaixo de `breakpoints.md` a tabela vira itens de quatro linhas e os alvos de toque chegam a 44px.
const mobile = ({ theme }: { theme: { breakpoints: { md: string } } }) => `@media (max-width: calc(${theme.breakpoints.md} - 1px))`;

export const Area = styled.div<{ $atualizando: boolean }>`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow-x: auto;
  opacity: ${({ $atualizando }) => ($atualizando ? 0.6 : 1)};
  transition: opacity 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* No celular a tabela vira uma lista de itens (ver Linha): sem moldura e sem rolagem lateral. */
  ${mobile} {
    border: none;
    border-radius: 0;
    overflow-x: visible;

    table,
    tbody {
      display: block;
    }
  }
`;

// A linha da tabela no computador; no celular, uma grade de quatro faixas sem os rótulos de cartão.
export const Linha = styled(TableRow)`
  ${mobile} {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    /* As ações ocupam só as duas primeiras faixas: a data de entrada ganha a largura toda e não quebra. */
    grid-template-areas:
      "placa placa acoes"
      "veiculo veiculo acoes"
      "permanencia entrada entrada"
      "preco preco preco";
    align-items: center;
    gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
    padding: ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[1]}px;

    & > td {
      display: block;
      min-width: 0;
      padding: 0;
      text-align: left;

      &::before {
        content: none;
      }
    }

    & > td[data-label="Placa"] {
      grid-area: placa;
    }

    & > td[data-label="Veículo"] {
      grid-area: veiculo;
    }

    & > td[data-label="Permanência"] {
      grid-area: permanencia;
    }

    & > td[data-label="Entrada"] {
      grid-area: entrada;
      color: ${({ theme }) => theme.colors.textMuted};
      font-size: ${({ theme }) => theme.fontSizes.xs};

      /* "17/10/26 15:30" passa a "entrou 17/10/26 15:30"; ticket e sequencial ficam para o computador. */
      > span:first-child::before {
        content: "entrou ";
      }

      > span + span {
        display: none;
      }
    }

    & > td[data-label="Tabela e operador"] {
      grid-area: preco;
      color: ${({ theme }) => theme.colors.textMuted};
      font-size: ${({ theme }) => theme.fontSizes.xs};
    }

    & > td[data-label="Ações"] {
      grid-area: acoes;
      align-self: start;
    }
  }
`;

export const Celula = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
`;

export const PlacaCelula = styled(Celula)`
  align-items: flex-start;
`;

export const Selo = styled.span`
  display: inline-flex;
`;

export const Modelo = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Computador: modelo, cor e categoria empilhados. Celular: uma linha só, "Gol · Prata · Carro pequeno".
export const VeiculoCelula = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;

  ${mobile} {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 ${({ theme }) => theme.space[2]}px;
    font-size: ${({ theme }) => theme.fontSizes.sm};

  }
`;

export const CorLinha = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// A cor do veículo é um dado dele, igual nos dois temas: não é um token de tema.
export const Amostra = styled.span<{ $cor: string }>`
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ $cor }) => $cor};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const CategoriaLinha = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};

  svg {
    flex: none;
    width: 28px;
    height: auto;
  }

  ${mobile} {
    font-size: ${({ theme }) => theme.fontSizes.sm};

    svg {
      display: none;
    }
  }
`;

export const Sub = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Permanencia = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

// Duas linhas curtas; o texto completo está no `title`.
export const Truncar = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PrecoCelula = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-width: 0;
  max-width: 220px;

  ${mobile} {
    max-width: none;
    flex-direction: row;
    gap: ${({ theme }) => theme.space[2]}px;

    > span {
      min-width: 0;
    }

    > span + span::before {
      content: "·";
      margin-right: ${({ theme }) => theme.space[2]}px;
    }
  }
`;

export const AcoesCelula = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]}px;

  ${mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

// "Registrar saída" e, logo abaixo, a chave: os dois controles do veículo ficam juntos, na mesma coluna.
export const AcoesPrincipais = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Mantém a coluna das ações alinhada quando um veículo não tem comprovante (computador).
export const ComprovanteVazio = styled.span`
  flex: none;
  width: 44px;
  height: 44px;

  ${mobile} {
    display: none;
  }
`;

export const SaidaBotao = styled(Button)`
  white-space: nowrap;

  ${mobile} {
    min-height: 44px;
  }
`;

// O comprovante é um link (abre em nova aba) com a aparência de um botão de ícone.
export const ComprovanteLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.link};
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  ${mobile} {
    align-self: flex-end;
  }
`;

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
`;

export const Resumo = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
  }
`;

export const AtualizarBotao = styled(Button)`
  /* O secundário tem o fundo da página e sumiria: ganha um contorno. */
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  ${mobile} {
    min-height: 44px;
  }
`;

export const BarraFiltros = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const BuscaCampo = styled.div`
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 360px;
  }
`;

// Mensalistas e avulsos numa barra só: o tamanho de cada trecho é a proporção, e tocar nele filtra.
export const ProporcaoBarra = styled.div`
  display: flex;
  height: 44px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const Segmento = styled.button<{ $valor: number; $tipo: "mensalistas" | "avulsos" }>`
  flex: ${({ $valor }) => $valor} 1 auto;
  min-width: 0;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 0;
  background-color: ${({ theme, $tipo }) => ($tipo === "mensalistas" ? theme.colors.cliente.mensal : theme.colors.cliente.avulso)};
  color: ${({ theme }) => theme.colors.onPrimary};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

  &[aria-pressed="true"] {
    box-shadow: inset 0 0 0 3px ${({ theme }) => theme.colors.warn};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -3px;
  }
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

export const GraficosDetalhes = styled.details`
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
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > :last-child {
      grid-column: 1 / -1;
    }
  }
`;

export const MaisBotao = styled(Button)`
  align-self: flex-start;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

  ${mobile} {
    min-height: 44px;
  }
`;

export const EsqueletoLinha = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

// Anúncio para leitor de tela; não aparece na tela.
export const Anuncio = styled.span`
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

// Botão da chave no card: um só controle para guardar a chave ou trocar de gancho. Com gancho é uma etiqueta cheia
// (quadro em cima, posição embaixo); sem gancho ecoa o gancho livre da grade: contorno tracejado e convite a guardar.
export const ChaveBotaoEstilo = styled.button<{ $semGancho: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
  min-height: 40px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[2]}px;
  border: 1.5px ${({ $semGancho }) => ($semGancho ? "dashed" : "solid")}
    ${({ theme, $semGancho }) => ($semGancho ? theme.colors.borderStrong : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $semGancho }) => ($semGancho ? "transparent" : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  ${mobile} {
    min-height: 44px;
  }
`;

export const ChaveIcone = styled.span`
  display: inline-flex;
  flex: none;
  color: ${({ theme }) => theme.colors.accent};

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ChaveTexto = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
`;

// Linha de cima: o nome do quadro (com gancho) ou o convite (sem gancho).
export const ChaveTopo = styled.span<{ $destaque: boolean }>`
  overflow: hidden;
  color: ${({ theme, $destaque }) => ($destaque ? theme.colors.text : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme, $destaque }) => ($destaque ? theme.fontWeights.bold : theme.fontWeights.medium)};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Linha de baixo: a posição em destaque (com gancho) ou o estado em texto (sem gancho).
export const ChavePosicao = styled.span`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

export const ForaDoQuadro = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Ponto de atenção do "Fora do quadro": decorativo, o texto é quem diz o estado.
export const PontoAtencao = styled.span`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.warn};
`;
