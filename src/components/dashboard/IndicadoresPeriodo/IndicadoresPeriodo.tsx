"use client";

import type { DashboardPeriodo } from "@/types/dashboard";
import { SEM_VALOR, brl, permanencia } from "../format";
import { PainelDashboard } from "../PainelDashboard";
import { Grade, Subtexto, Valor } from "./IndicadoresPeriodo.styles";

export interface IndicadoresPeriodoProps {
  periodo: DashboardPeriodo;
}

type Indicador = { titulo: string; valor: string | null; subtexto: string; semDado: string };

function indicadores(periodo: DashboardPeriodo): Indicador[] {
  return [
    {
      titulo: "Saídas",
      valor: periodo.saidas > 0 ? periodo.saidas.toLocaleString("pt-BR") : null,
      subtexto: "veículos atendidos",
      semDado: "sem saídas no período",
    },
    {
      titulo: "Ticket médio",
      valor: periodo.ticketMedio === null ? null : brl(periodo.ticketMedio, { centavos: true }),
      subtexto: "por saída paga",
      semDado: "sem saídas pagas",
    },
    {
      titulo: "Permanência",
      valor: periodo.permanenciaMediaMinutos === null ? null : permanencia(periodo.permanenciaMediaMinutos),
      subtexto: "média das saídas",
      semDado: "sem saídas no período",
    },
  ];
}

// Saídas, ticket médio e permanência média do período. Sem base para calcular mostra o travessão e diz o porquê: nunca zero.
export function IndicadoresPeriodo({ periodo }: IndicadoresPeriodoProps) {
  return (
    <Grade>
      {indicadores(periodo).map((indicador) => (
        <PainelDashboard key={indicador.titulo} titulo={indicador.titulo}>
          <Valor $semValor={indicador.valor === null}>{indicador.valor ?? SEM_VALOR}</Valor>
          <Subtexto>{indicador.valor === null ? indicador.semDado : indicador.subtexto}</Subtexto>
        </PainelDashboard>
      ))}
    </Grade>
  );
}
