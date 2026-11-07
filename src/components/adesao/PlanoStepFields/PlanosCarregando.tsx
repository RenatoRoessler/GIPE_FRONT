"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { CartaoCarregando, GradeCarregando, VisuallyHidden } from "./PlanoStepFields.styles";

// Dica de layout (a resposta de hoje tem dois planos), não dado de negócio.
const PLANOS_ESPERADOS = 2;

export function PlanosCarregando() {
  return (
    <GradeCarregando role="status" aria-busy="true">
      <VisuallyHidden>Carregando planos…</VisuallyHidden>
      {Array.from({ length: PLANOS_ESPERADOS }, (_, indice) => (
        <CartaoCarregando key={indice}>
          <Skeleton width="40%" height="18px" />
          <Skeleton width="55%" height="28px" />
          <Skeleton width="80%" height="14px" />
        </CartaoCarregando>
      ))}
    </GradeCarregando>
  );
}
