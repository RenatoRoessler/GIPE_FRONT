"use client";

import type { PrecoRegraView } from "@/types/preco";
import { montarSemana } from "../semana";
import { Detalhe, Dia, Linha, Lista, Marcas, Observacao, Oculto, Regua, Segmento, Texto, Trilho, Wrapper } from "./PrecoSemana.styles";

export interface PrecoSemanaProps {
  regras: PrecoRegraView[];
}

const HORAS_DA_REGUA = ["0h", "6h", "12h", "18h", "24h"];

// Sete linhas, de domingo a sábado. O trilho de 24 h é só reforço visual: cada linha tem o intervalo em texto.
export function PrecoSemana({ regras }: PrecoSemanaProps) {
  const semana = montarSemana(regras);

  return (
    <Wrapper>
      <Regua aria-hidden="true">
        <Marcas>
          {HORAS_DA_REGUA.map((hora) => (
            <span key={hora}>{hora}</span>
          ))}
        </Marcas>
      </Regua>
      <Lista aria-label="Horários de cobrança por dia da semana">
        {semana.map((linha) => {
          const periodos = linha.trechos.map((trecho) => trecho.periodo).filter((periodo): periodo is string => Boolean(periodo));
          return (
            <Linha key={linha.dia.codigo} $inativa={linha.inativa}>
              <Dia>
                <span aria-hidden="true">{linha.dia.label.slice(0, 3)}</span>
                <Oculto>{linha.dia.label}</Oculto>
              </Dia>
              <Trilho aria-hidden="true">
                {linha.trechos.map((trecho, index) => (
                  <Segmento key={index} $de={trecho.de} $ate={trecho.ate} $inativo={trecho.inativo} />
                ))}
              </Trilho>
              <Detalhe>
                <Texto $semCobranca={linha.tipo === "sem_cobranca"}>
                  {linha.texto}
                </Texto>
                {linha.inativa && <Observacao>Inativa</Observacao>}
                {periodos.length > 0 && <Observacao>{periodos.join("; ")}</Observacao>}
              </Detalhe>
            </Linha>
          );
        })}
      </Lista>
    </Wrapper>
  );
}
