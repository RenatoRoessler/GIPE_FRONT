"use client";

import { STATUS_SERVICO, type ItemFila } from "@/types/servico";
import { resumirFila } from "../fila";
import { Atrasados, Chip, Lista, Ponto } from "./ResumoDaFila.styles";

export interface ResumoDaFilaProps {
  // A fila inteira, sem o filtro da busca: o resumo diz como está o pátio, não o que a busca mostra.
  itens: ItemFila[];
  agora: number;
}

const plural = (quantidade: number, singular: string, pluralTexto: string) => `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;

// Uma pílula por status, com a contagem, e outra com os serviços que passaram da previsão (só quando há). A cor do ponto
// só reforça: o texto diz tudo.
export function ResumoDaFila({ itens, agora }: ResumoDaFilaProps) {
  const { porStatus, atrasados } = resumirFila(itens, agora);

  return (
    <Lista aria-label="Resumo da fila">
      <Chip>
        <Ponto $tom="neutro" aria-hidden="true" />
        {plural(porStatus[STATUS_SERVICO.Aguardando], "na fila", "na fila")}
      </Chip>
      <Chip>
        <Ponto $tom="andamento" aria-hidden="true" />
        {plural(porStatus[STATUS_SERVICO.EmExecucao], "em andamento", "em andamento")}
      </Chip>
      <Chip>
        <Ponto $tom="pronto" aria-hidden="true" />
        {plural(porStatus[STATUS_SERVICO.Pronto], "pronto", "prontos")}
      </Chip>
      {atrasados > 0 && <Atrasados>{atrasados} passou da previsão</Atrasados>}
    </Lista>
  );
}
