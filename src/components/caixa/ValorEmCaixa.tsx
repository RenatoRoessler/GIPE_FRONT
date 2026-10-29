"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Caixa, Movimento } from "@/types/caixa";
import { totaisPorForma } from "./agregados";
import { Apoio, Cartao, Destaque, Erro, Rotulo } from "./CaixaResumo.styles";
import { formatMoeda } from "./format";
import { totalDeTickets, valorEmCaixa } from "./resumo";

export interface ValorEmCaixaProps {
  caixa: Caixa;
  movimentos: UseQueryResult<Movimento[]>;
}

// O valor vem do próprio caixa; só a quantidade de tickets espera os movimentos.
export function ValorEmCaixa({ caixa, movimentos }: ValorEmCaixaProps) {
  const titulo = useId();
  const tickets = movimentos.data ? totalDeTickets(totaisPorForma(movimentos.data)) : null;

  return (
    <Cartao aria-labelledby={titulo}>
      <Rotulo id={titulo}>Valor em caixa</Rotulo>
      <Destaque>{formatMoeda(valorEmCaixa(caixa))}</Destaque>
      {tickets !== null ? (
        <Apoio>
          Recebido <strong>{formatMoeda(caixa.valorTotalEntrada)}</strong> em{" "}
          <strong>{tickets === 1 ? "1 ticket" : `${tickets} tickets`}</strong> + fundo de caixa
        </Apoio>
      ) : movimentos.isError ? (
        <Erro>
          <ErrorBanner role="alert">{movimentos.error.message}</ErrorBanner>
          <Button type="button" size="sm" variant="secondary" onClick={() => void movimentos.refetch()}>
            Tentar novamente
          </Button>
        </Erro>
      ) : (
        <div role="status" aria-busy="true">
          <Skeleton width="70%" height="16px" />
        </div>
      )}
    </Cartao>
  );
}
