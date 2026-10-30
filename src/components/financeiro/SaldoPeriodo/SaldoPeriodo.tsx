"use client";

import { useId } from "react";
import { formatBRL } from "@/lib/money";
import type { FluxoCaixa } from "@/types/financeiro";
import { Apoio, Cartao, Destaque, Periodo, Rotulo, Total } from "../FluxoCaixa/FluxoCaixa.styles";
import { formatSaldo, periodoPorExtenso } from "../format";

export interface SaldoPeriodoProps {
  fluxo: Pick<FluxoCaixa, "dataInicio" | "dataFim" | "saldo" | "totalEntradas" | "totalSaidas">;
}

function Seta({ para }: { para: "cima" | "baixo" }) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d={para === "cima" ? "M6 1.5 11 10H1z" : "M6 10.5 1 2h10z"} />
    </svg>
  );
}

// O saldo do período é a resposta da tela: um número só, com as entradas e saídas que o explicam.
export function SaldoPeriodo({ fluxo }: SaldoPeriodoProps) {
  const titulo = useId();
  const negativo = fluxo.saldo < 0;
  const periodo = periodoPorExtenso(fluxo.dataInicio, fluxo.dataFim);

  return (
    <Cartao aria-labelledby={titulo}>
      <Rotulo id={titulo}>Saldo do período</Rotulo>
      <Destaque $negativo={negativo} aria-label={`${negativo ? "Negativo, " : ""}${formatBRL(Math.abs(fluxo.saldo))}`}>
        {formatSaldo(fluxo.saldo)}
      </Destaque>
      <Apoio>
        <Total $lado="entrada">
          <Seta para="cima" />
          Entradas <strong>{formatBRL(fluxo.totalEntradas)}</strong>
        </Total>
        <Total $lado="saida">
          <Seta para="baixo" />
          Saídas <strong>{formatBRL(fluxo.totalSaidas)}</strong>
        </Total>
        {periodo && <Periodo>{periodo}</Periodo>}
      </Apoio>
    </Cartao>
  );
}
