"use client";

import { formatBRL } from "@/lib/money";
import type { Caixa } from "@/types/caixa";
import { CardGrid, StatCard, StatLabel, StatValue } from "./Caixa.styles";
import { formatDateTime } from "./format";

export function SaldoCards({ caixa }: { caixa: Caixa }) {
  const totalEntrada = caixa.valorTotalEntrada ?? 0;
  const totalSaida = caixa.valorTotalSaida ?? 0;
  const saldo = caixa.saldoAtual ?? caixa.valorFundoCaixa + totalEntrada - totalSaida;

  return (
    <CardGrid>
      <StatCard $highlight>
        <StatLabel>Saldo</StatLabel>
        <StatValue $large>{formatBRL(saldo)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Fundo de caixa</StatLabel>
        <StatValue>{formatBRL(caixa.valorFundoCaixa)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Entradas</StatLabel>
        <StatValue $tone="success">{formatBRL(totalEntrada)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Saídas</StatLabel>
        <StatValue $tone="danger">{formatBRL(totalSaida)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Abertura</StatLabel>
        <StatValue>{formatDateTime(caixa.dataHoraAbertura)}</StatValue>
      </StatCard>
    </CardGrid>
  );
}
