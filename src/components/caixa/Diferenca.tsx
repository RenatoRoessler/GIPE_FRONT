"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { DiferencaGroup } from "./Caixa.styles";
import { describeDiferenca } from "./format";

// O estado é dito em texto (Sobra/Falta); a cor apenas reforça.
export function Diferenca({ value }: { value: number | null }) {
  const info = describeDiferenca(value);
  if (!info) {
    return <>—</>;
  }
  return (
    <DiferencaGroup>
      <StatusBadge tone={info.tone}>{info.label}</StatusBadge>
      {value !== 0 && info.value}
    </DiferencaGroup>
  );
}
