"use client";

import { useId } from "react";
import type { PatioContagem } from "@/types/patio";
import { BarraItem, Barras, Painel, PainelTitulo, Preenchimento, Trilho } from "./Graficos.styles";

export interface BarrasHorizontaisProps {
  titulo: string;
  itens: (PatioContagem & { longa?: boolean })[];
}

// Lista de barras: o número vem sempre em texto, a barra só reforça a proporção.
export function BarrasHorizontais({ titulo, itens }: BarrasHorizontaisProps) {
  const tituloId = useId();
  const maior = Math.max(1, ...itens.map((item) => item.valor));

  return (
    <Painel aria-labelledby={tituloId}>
      <PainelTitulo id={tituloId}>{titulo}</PainelTitulo>
      <Barras>
        {itens.map((item) => (
          <BarraItem key={item.rotulo}>
            <span title={item.rotulo}>{item.rotulo}</span>
            <Trilho aria-hidden="true">
              <Preenchimento $percentual={item.valor === 0 ? 0 : Math.max(3, (item.valor / maior) * 100)} $risco={item.longa === true} />
            </Trilho>
            <strong>{item.valor}</strong>
          </BarraItem>
        ))}
      </Barras>
    </Painel>
  );
}
