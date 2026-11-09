"use client";

import { useEffect, useRef } from "react";
import type { PrecoView } from "@/types/preco";
import type { DirecaoFoco } from "../PrecoListItem";
import { Posicao, Trilho } from "./EsteiraPlacas.styles";
import { PlacaMini } from "./PlacaMini";

export interface EsteiraPlacasProps {
  itens: PrecoView[];
  selecionadaId: number | null;
  onSelecionar: (id: number) => void;
  agora?: Date;
}

// Esteira horizontal de miniplacas: trocar de tabela sem sair da tela. Só uma placa entra na ordem de Tab
// (a selecionada, ou a primeira); as setas, Home e End movem o foco entre elas.
export function EsteiraPlacas({ itens, selecionadaId, onSelecionar, agora }: Readonly<EsteiraPlacasProps>) {
  const placasRef = useRef<(HTMLButtonElement | null)[]>([]);

  // A tabela escolhida sempre fica à vista, mesmo quando foi escolhida em outro lugar (lista completa ou endereço).
  useEffect(() => {
    const indice = itens.findIndex((item) => item.rotatividadeId === selecionadaId);
    placasRef.current[indice]?.scrollIntoView?.({ inline: "nearest", block: "nearest" });
  }, [itens, selecionadaId]);

  function moverFoco(indice: number, direcao: DirecaoFoco) {
    const ultimo = itens.length - 1;
    let alvo = Math.max(indice - 1, 0);
    if (direcao === "inicio") {
      alvo = 0;
    } else if (direcao === "fim") {
      alvo = ultimo;
    } else if (direcao === "proximo") {
      alvo = Math.min(indice + 1, ultimo);
    }
    placasRef.current[alvo]?.focus();
  }

  const indiceNoTab = Math.max(0, itens.findIndex((item) => item.rotatividadeId === selecionadaId));

  return (
    <Trilho aria-label="Escolher tabela de preço">
      {itens.map((item, indice) => (
        <Posicao key={item.rotatividadeId}>
          <PlacaMini
            ref={(node) => {
              placasRef.current[indice] = node;
            }}
            preco={item}
            agora={agora}
            selecionada={item.rotatividadeId === selecionadaId}
            tabIndex={indice === indiceNoTab ? 0 : -1}
            onSelecionar={onSelecionar}
            onMoverFoco={(direcao) => moverFoco(indice, direcao)}
          />
        </Posicao>
      ))}
    </Trilho>
  );
}
