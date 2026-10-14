"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL } from "@/lib/money";
import type { CaixaSaldo } from "@/types/caixa";
import { CardGrid, StatCard, StatLabel, StatValue, VisuallyHidden } from "./Caixa.styles";
import { formatDateTime } from "./format";

export function SaldoCards({ saldo }: { saldo?: CaixaSaldo }) {
  if (!saldo) {
    return (
      <CardGrid role="status" aria-busy="true">
        <VisuallyHidden>Carregando saldo…</VisuallyHidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} height="84px" radius="16px" />
        ))}
      </CardGrid>
    );
  }

  return (
    <CardGrid>
      <StatCard $highlight>
        <StatLabel>Saldo</StatLabel>
        <StatValue $large>{formatBRL(saldo.saldo)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Fundo de caixa</StatLabel>
        <StatValue>{formatBRL(saldo.fundoCaixa)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Entradas</StatLabel>
        <StatValue $tone="success">{formatBRL(saldo.totalEntrada)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Saídas</StatLabel>
        <StatValue $tone="danger">{formatBRL(saldo.totalSaida)}</StatValue>
      </StatCard>
      <StatCard>
        <StatLabel>Abertura</StatLabel>
        <StatValue>{formatDateTime(saldo.dataAbertura)}</StatValue>
      </StatCard>
    </CardGrid>
  );
}
