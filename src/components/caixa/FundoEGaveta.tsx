"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Caixa, Turno } from "@/types/caixa";
import { Apoio, Cartao, Dupla, Erro, Rotulo, Valor } from "./CaixaResumo.styles";
import { formatMoeda } from "./format";
import { calcularGaveta } from "./gaveta";

export interface FundoEGavetaProps {
  caixa: Caixa;
  turno: UseQueryResult<Turno | null>;
}

// O fundo vem do caixa; o dinheiro na gaveta espera o turno. Sem turno (ou sem número válido), traço.
export function FundoEGaveta({ caixa, turno }: FundoEGavetaProps) {
  const tituloFundo = useId();
  const tituloGaveta = useId();
  const naGaveta = turno.data ? calcularGaveta(turno.data).naGaveta : null;

  return (
    <Dupla>
      <Cartao aria-labelledby={tituloFundo}>
        <Rotulo id={tituloFundo}>Fundo de caixa</Rotulo>
        <Valor>{formatMoeda(caixa.valorFundoCaixa)}</Valor>
        <Apoio>Troco na abertura</Apoio>
      </Cartao>
      <Cartao aria-labelledby={tituloGaveta}>
        <Rotulo id={tituloGaveta}>Dinheiro na gaveta</Rotulo>
        {turno.isError ? (
          <Erro>
            <ErrorBanner role="alert">{turno.error.message}</ErrorBanner>
            <Button type="button" size="sm" variant="secondary" onClick={() => void turno.refetch()}>
              Tentar novamente
            </Button>
          </Erro>
        ) : turno.data === undefined ? (
          <div role="status" aria-busy="true">
            <Skeleton width="60%" height="28px" />
          </div>
        ) : (
          <>
            <Valor>{formatMoeda(naGaveta)}</Valor>
            <Apoio>{turno.data === null ? "Não há turno em andamento" : "Fundo + dinheiro recebido"}</Apoio>
          </>
        )}
      </Cartao>
    </Dupla>
  );
}
