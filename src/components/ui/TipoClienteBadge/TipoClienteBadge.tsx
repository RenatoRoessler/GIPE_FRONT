"use client";

import type { TipoCliente } from "@/types/conferenciaPatio";
import { Selo, type TipoClienteBadgeSize } from "./TipoClienteBadge.styles";

const INICIAL: Record<TipoCliente, string> = { avulso: "P", mensal: "M", conveniado: "C" };
const NOME: Record<TipoCliente, string> = { avulso: "Avulso", mensal: "Mensal", conveniado: "Conveniado" };

export interface TipoClienteBadgeProps {
  tipo: TipoCliente;
  size?: TipoClienteBadgeSize;
}

// A inicial sozinha não basta: o nome por extenso vai no nome acessível e no tooltip, e a tela o repete em texto.
export function TipoClienteBadge({ tipo, size = "md" }: TipoClienteBadgeProps) {
  return (
    <Selo $tipo={tipo} $size={size} role="img" aria-label={NOME[tipo]} title={NOME[tipo]}>
      <span aria-hidden="true">{INICIAL[tipo]}</span>
    </Selo>
  );
}
