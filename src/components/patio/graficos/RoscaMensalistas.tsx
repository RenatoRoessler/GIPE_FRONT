"use client";

import { useId } from "react";
import { useTheme } from "styled-components";
import { Amostra, Legenda, Painel, PainelTitulo, RoscaCentro, RoscaFigura, RoscaLinha } from "./Graficos.styles";

export interface RoscaMensalistasProps {
  mensalistas: number;
  avulsos: number;
  percentual: number;
}

// Circunferência de r = 15,9155 vale 100: o traço de cada fatia é o próprio percentual.
export function RoscaMensalistas({ mensalistas, avulsos, percentual }: RoscaMensalistasProps) {
  const tituloId = useId();
  const { colors } = useTheme();

  return (
    <Painel aria-labelledby={tituloId}>
      <PainelTitulo id={tituloId}>Mensalistas e avulsos</PainelTitulo>
      <RoscaLinha>
        <RoscaFigura>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke={colors.steel} strokeWidth="5" />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={colors.primary}
              strokeWidth="5"
              strokeDasharray={`${percentual} ${100 - percentual}`}
            />
          </svg>
          <RoscaCentro>{percentual}%</RoscaCentro>
        </RoscaFigura>
        <Legenda>
          <li>
            <Amostra $cor="primary" aria-hidden="true" />
            Mensalistas <strong>{mensalistas}</strong>
          </li>
          <li>
            <Amostra $cor="steel" aria-hidden="true" />
            Avulsos <strong>{avulsos}</strong>
          </li>
        </Legenda>
      </RoscaLinha>
    </Painel>
  );
}
