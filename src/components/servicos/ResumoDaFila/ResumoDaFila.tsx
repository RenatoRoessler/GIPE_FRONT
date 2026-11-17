"use client";

import type { ReactNode } from "react";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";
import { resumirFila } from "../fila";
import type { StatusDaFila } from "../status";
import { Atrasados, Chip, ChipBotao, Item, Lista, Ponto } from "./ResumoDaFila.styles";

// Para onde cada pílula leva quando ela é tocável.
export type AlvoDoResumo = "aguardando" | "execucao" | "pronto" | "atrasados";

export interface ResumoDaFilaProps {
  // A fila inteira, sem o filtro da busca: o resumo diz como está o pátio, não o que a busca mostra.
  itens: ItemFila[];
  agora: number;
  // Com isto as pílulas viram botões (celular, onde só uma coluna aparece); sem isto são só texto (desktop).
  onSelecionar?: (alvo: AlvoDoResumo) => void;
  // A coluna aberta, para marcar a pílula correspondente.
  statusAtual?: StatusDaFila;
}

const plural = (quantidade: number, singular: string, pluralTexto: string) => `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;

// Uma pílula por status, com a contagem, e outra com os serviços que passaram da previsão (só quando há). A cor do ponto
// só reforça: o texto diz tudo.
export function ResumoDaFila({ itens, agora, onSelecionar, statusAtual }: ResumoDaFilaProps) {
  const { porStatus, atrasados } = resumirFila(itens, agora);

  function pilula(alvo: Exclude<AlvoDoResumo, "atrasados">, status: StatusDaFila, conteudo: ReactNode) {
    if (!onSelecionar) {
      return <Chip>{conteudo}</Chip>;
    }
    const atual = statusAtual === status;
    return (
      <Item>
        <ChipBotao type="button" $atual={atual} aria-pressed={atual} onClick={() => onSelecionar(alvo)}>
          {conteudo}
        </ChipBotao>
      </Item>
    );
  }

  return (
    <Lista aria-label="Resumo da fila">
      {pilula(
        "aguardando",
        STATUS_SERVICO.Aguardando,
        <>
          <Ponto $tom="neutro" aria-hidden="true" />
          {plural(porStatus[STATUS_SERVICO.Aguardando], "na fila", "na fila")}
        </>,
      )}
      {pilula(
        "execucao",
        STATUS_SERVICO.EmExecucao,
        <>
          <Ponto $tom="andamento" aria-hidden="true" />
          {plural(porStatus[STATUS_SERVICO.EmExecucao], "em andamento", "em andamento")}
        </>,
      )}
      {pilula(
        "pronto",
        STATUS_SERVICO.Pronto,
        <>
          <Ponto $tom="pronto" aria-hidden="true" />
          {plural(porStatus[STATUS_SERVICO.Pronto], "pronto", "prontos")}
        </>,
      )}
      {atrasados > 0 &&
        (onSelecionar ? (
          <Item>
            <ChipBotao type="button" $atrasados onClick={() => onSelecionar("atrasados")}>
              {atrasados} passou da previsão
            </ChipBotao>
          </Item>
        ) : (
          <Atrasados>{atrasados} passou da previsão</Atrasados>
        ))}
    </Lista>
  );
}
