"use client";

import { formatMinutos } from "@/components/precos/format";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatTime } from "@/components/caixa/format";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";
import { decorridoEmExecucao, minutosAtrasado, previsaoDeTermino, progresso, prontoHa, tempoNaFila } from "../fila";
import { Atraso, Linha, Tempo } from "./FilaTempo.styles";

export interface FilaTempoProps {
  item: ItemFila;
  // O instante de referência (ms), vindo de `useAgora`: o componente não tem relógio próprio.
  agora: number;
}

const horaDaPrevisao = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

// O tempo do serviço, conforme o status: há quanto tempo espera, quanto falta, há quanto tempo ficou pronto. Cada trecho só
// aparece se o back mandou o dado de que ele depende; nunca se estima um tempo.
export function FilaTempo({ item, agora }: FilaTempoProps) {
  if (item.status === STATUS_SERVICO.Aguardando) {
    const espera = tempoNaFila(item, agora);
    const leva = item.duracaoMinutos;
    if (espera === null && !leva) return null;
    return (
      <Tempo>
        <Linha>
          {espera !== null && (
            <span>
              Na fila há <b>{formatMinutos(espera)}</b>
            </span>
          )}
          {leva ? <span>leva ~{formatMinutos(leva)}</span> : <span>sem previsão</span>}
        </Linha>
      </Tempo>
    );
  }

  if (item.status === STATUS_SERVICO.EmExecucao) {
    const decorrido = decorridoEmExecucao(item, agora);
    const termino = previsaoDeTermino(item);
    const andamento = progresso(item, agora);
    const atraso = minutosAtrasado(item, agora);
    if (decorrido === null) return null;
    return (
      <Tempo>
        <Linha>
          <span>
            Iniciado às <b>{formatTime(item.iniciadoEm ?? null)}</b> · há {formatMinutos(decorrido)}
          </span>
          {termino && (
            <span>
              termina ~<b>{horaDaPrevisao.format(termino)}</b>
            </span>
          )}
        </Linha>
        {andamento !== null && <ProgressBar value={andamento} max={100} aria-label={`Andamento de ${item.nomeServico}: ${andamento}%`} />}
        {atraso > 0 && <Atraso>Passou {formatMinutos(atraso)} da previsão</Atraso>}
      </Tempo>
    );
  }

  if (item.status === STATUS_SERVICO.Pronto) {
    const espera = prontoHa(item, agora);
    if (espera === null) return null;
    return (
      <Tempo>
        <Linha>
          <span>
            Pronto às <b>{formatTime(item.prontoEm ?? null)}</b>
          </span>
          <span>aguardando retirada há {formatMinutos(espera)}</span>
        </Linha>
      </Tempo>
    );
  }

  return null;
}
