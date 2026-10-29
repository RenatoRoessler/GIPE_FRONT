"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Caixa, Movimento } from "@/types/caixa";
import { totaisPorForma } from "./agregados";
import {
  Amostra,
  BarraEmpilhada,
  Cartao,
  CartaoTopo,
  Erro,
  LinhaForma,
  ListaFormas,
  NomeForma,
  Rotulo,
  Trecho,
  Valor,
} from "./CaixaResumo.styles";
import { formatMoeda } from "./format";
import { formasDoResumo } from "./resumo";

export interface RecebidoPorFormaProps {
  caixa: Caixa;
  movimentos: UseQueryResult<Movimento[]>;
}

function quantidadeLabel(quantidade: number): string {
  return quantidade === 1 ? "1 ticket" : `${quantidade} tickets`;
}

export function RecebidoPorForma({ caixa, movimentos }: RecebidoPorFormaProps) {
  const titulo = useId();
  const formas = movimentos.data ? formasDoResumo(totaisPorForma(movimentos.data)) : null;

  return (
    <Cartao aria-labelledby={titulo}>
      <CartaoTopo>
        <Rotulo id={titulo}>Por forma de pagamento</Rotulo>
        <Valor>{formatMoeda(caixa.valorTotalEntrada)}</Valor>
      </CartaoTopo>
      {formas ? (
        <>
          <BarraEmpilhada aria-hidden="true">
            {formas
              .filter((forma) => forma.percentual > 0)
              .map((forma) => (
                <Trecho key={forma.formaPagamento} $cor={forma.cor} $percentual={forma.percentual} />
              ))}
          </BarraEmpilhada>
          <ListaFormas>
            {formas.map((forma) => (
              <LinhaForma key={forma.formaPagamento}>
                <Amostra $cor={forma.cor} aria-hidden="true" />
                <NomeForma>
                  {forma.rotulo}
                  <small>{quantidadeLabel(forma.quantidade)}</small>
                </NomeForma>
                <Valor>{formatMoeda(forma.valor)}</Valor>
              </LinhaForma>
            ))}
          </ListaFormas>
        </>
      ) : movimentos.isError ? (
        <Erro>
          <ErrorBanner role="alert">{movimentos.error.message}</ErrorBanner>
          <Button type="button" size="sm" variant="secondary" onClick={() => void movimentos.refetch()}>
            Tentar novamente
          </Button>
        </Erro>
      ) : (
        <div role="status" aria-busy="true">
          <Skeleton height="12px" />
          <Skeleton height="96px" />
        </div>
      )}
    </Cartao>
  );
}
