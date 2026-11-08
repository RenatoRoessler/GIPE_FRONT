"use client";

import { formatDateTime } from "@/components/caixa/format";
import { formatarMinutos, rotuloCategoria } from "@/components/patio/patio";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { formatBRL } from "@/lib/money";
import type { FaturaItem } from "@/types/fatura";
import { CartaoSaida, SaidaApoio, SaidaLinha, SaidaTopo, SaidaValor } from "../FaturasMobile.styles";
import { regraConveniada } from "../format";

export interface SaidaCardProps {
  item: FaturaItem;
}

// Saída da fatura no celular, em quatro linhas: placa e valor da conveniada, modelo e categoria, período e regra, valores do total e do cliente.
export function SaidaCard({ item }: SaidaCardProps) {
  return (
    <CartaoSaida>
      <SaidaTopo>
        <PlateDisplay value={item.placa} size="sm" />
        <SaidaValor>
          <strong>{formatBRL(item.valorConveniada)}</strong>
          <span>da conveniada</span>
        </SaidaValor>
      </SaidaTopo>
      <SaidaApoio>{[item.modelo, rotuloCategoria(item.categoria)].filter(Boolean).join(" · ")}</SaidaApoio>
      <SaidaLinha>
        {formatDateTime(item.dataEntrada)} → {formatDateTime(item.dataSaida)} · {formatarMinutos(item.minutosPermanencia)}
      </SaidaLinha>
      <SaidaLinha>
        {item.rotatividade ? `${item.rotatividade} · ` : ""}
        {regraConveniada(item)}
      </SaidaLinha>
      <SaidaApoio>
        Total {formatBRL(item.valorTotal)} · Cliente {formatBRL(item.valorCliente)}
      </SaidaApoio>
    </CartaoSaida>
  );
}
