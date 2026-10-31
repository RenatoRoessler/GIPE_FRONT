"use client";

import { ReactNode } from "react";
import { Barra } from "./ActionBar.styles";

export interface ActionBarProps {
  // Ação secundária (Voltar), à esquerda; ausente na primeira etapa.
  secundaria?: ReactNode;
  // Ação principal (Próximo, Criar conta), à direita.
  principal: ReactNode;
}

export function ActionBar({ secundaria, principal }: ActionBarProps) {
  return (
    <Barra>
      {secundaria}
      {principal}
    </Barra>
  );
}
