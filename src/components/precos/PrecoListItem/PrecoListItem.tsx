"use client";

import type { KeyboardEvent, Ref } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSituacao } from "@/lib/api/services/preco.mapper";
import type { PrecoView } from "@/types/preco";
import { getTipoRegraLabel } from "../format";
import { SITUACAO_BADGE } from "../situacao";
import { COR_DO_TIPO, Descricao, Item, Meta, Tipo } from "./PrecoListItem.styles";

export type DirecaoFoco = "anterior" | "proximo" | "inicio" | "fim";

export interface PrecoListItemProps {
  preco: PrecoView;
  selecionado: boolean;
  onSelecionar: (id: number) => void;
  // Quem renderiza a lista coordena o foco entre os itens (roving tabindex).
  tabIndex?: number;
  onMoverFoco?: (direcao: DirecaoFoco) => void;
  agora?: Date;
  ref?: Ref<HTMLButtonElement>;
}

const TECLAS: Record<string, DirecaoFoco> = {
  ArrowUp: "anterior",
  ArrowDown: "proximo",
  Home: "inicio",
  End: "fim",
};

// Item da lista de tabelas de preço: escolher não abre a edição, só mostra o detalhe.
export function PrecoListItem({ preco, selecionado, onSelecionar, tabIndex, onMoverFoco, agora, ref }: Readonly<PrecoListItemProps>) {
  const situacao = SITUACAO_BADGE[getSituacao(preco.ativo, preco.inicioVigencia, preco.fimVigencia, agora ?? new Date())];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direcao = TECLAS[event.key];
    if (direcao && onMoverFoco) {
      event.preventDefault();
      onMoverFoco(direcao);
    }
  }

  return (
    <Item
      ref={ref}
      type="button"
      $selecionado={selecionado}
      aria-current={selecionado ? "true" : undefined}
      tabIndex={tabIndex}
      onClick={() => onSelecionar(preco.rotatividadeId)}
      onKeyDown={handleKeyDown}
    >
      <Descricao>{preco.descricao}</Descricao>
      <Meta>
        <Tipo $cor={preco.tipoRegra ? COR_DO_TIPO[preco.tipoRegra] : "steel"}>{getTipoRegraLabel(preco.tipoRegra)}</Tipo>
        <StatusBadge tone={situacao.tone}>{situacao.label}</StatusBadge>
      </Meta>
    </Item>
  );
}
