"use client";

import { useId } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Caixa } from "@/types/caixa";
import { Apoio, Cartao, CartaoTopo, Rotulo } from "./CaixaResumo.styles";
import { formatDateTime } from "./format";

export function AberturaCaixa({ caixa }: { caixa: Caixa }) {
  const titulo = useId();

  return (
    <Cartao aria-labelledby={titulo}>
      <CartaoTopo>
        <Rotulo id={titulo}>Abertura do caixa</Rotulo>
        <StatusBadge tone="success">Aberto</StatusBadge>
      </CartaoTopo>
      <Apoio>
        Aberto em <strong>{formatDateTime(caixa.dataHoraAbertura)}</strong>
      </Apoio>
    </Cartao>
  );
}
