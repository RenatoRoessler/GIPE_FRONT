"use client";

import type { ReactNode } from "react";
import { getPlacaTipo, normalizePlaca } from "@/lib/placa";
import { Band, Plate, PlateNumber, type PlateSize, type PlateVariant } from "./PlateDisplay.styles";

export interface PlateDisplayProps {
  // Placa já digitada ou normalizada; o hífen do padrão antigo é aplicado aqui.
  value: string;
  // Padrão: derivado da placa (Mercosul enquanto não dá para saber).
  variant?: PlateVariant;
  size?: PlateSize;
  bandLabel?: string;
  // No tamanho lg o campo de placa do formulário entra no lugar do texto.
  children?: ReactNode;
}

function formatPlaca(value: string, variant: PlateVariant): string {
  const placa = normalizePlaca(value);
  return variant === "antiga" && placa.length > 3 ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;
}

export function PlateDisplay({ value, variant, size = "md", bandLabel = "BRASIL", children }: PlateDisplayProps) {
  const resolved = variant ?? getPlacaTipo(value) ?? "mercosul";

  return (
    <Plate $variant={resolved} $size={size} data-variant={resolved}>
      <Band $variant={resolved}>{bandLabel}</Band>
      {children ?? <PlateNumber>{formatPlaca(value, resolved) || "—"}</PlateNumber>}
    </Plate>
  );
}
