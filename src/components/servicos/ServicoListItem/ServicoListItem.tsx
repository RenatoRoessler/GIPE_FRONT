"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Servico } from "@/types/servico";
import { formatDuracao } from "../format";
import { Item, Linha, Nome } from "./ServicoListItem.styles";

export interface ServicoListItemProps {
  servico: Servico;
  selecionado: boolean;
  onSelecionar: (id: number) => void;
}

// Um serviço na lista do catálogo: o nome, a duração prevista e se está ativo. O selecionado não depende só da cor:
// `aria-current` o diz aos leitores de tela e a barra lateral o mostra a todos.
export function ServicoListItem({ servico, selecionado, onSelecionar }: ServicoListItemProps) {
  return (
    <Item type="button" aria-current={selecionado ? "true" : undefined} $selecionado={selecionado} onClick={() => onSelecionar(servico.id)}>
      <Nome>{servico.nome}</Nome>
      <Linha>
        {servico.duracaoMinutos !== null && <span>{formatDuracao(servico.duracaoMinutos)}</span>}
        <StatusBadge tone={servico.ativo ? "success" : "neutral"}>{servico.ativo ? "Ativo" : "Inativo"}</StatusBadge>
      </Linha>
    </Item>
  );
}
