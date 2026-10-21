"use client";

import { useId, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AgendaGrupoData, AgendaItemData, Mensalista } from "@/types/mensalista";
import type { AgendaAcao } from "../agenda";
import { AgendaItem } from "./AgendaItem";
import { Contagem, GrupoSection, GrupoTitulo, Lista, MaisBotao } from "./AgendaView.styles";

// Atrasados e quem vence hoje aparecem inteiros; os demais mostram os primeiros e deixam o resto atrás de um botão.
const LIMITE = 5;
const SEMPRE_INTEIROS = ["atrasados", "hoje"];

export interface AgendaGrupoProps {
  grupo: AgendaGrupoData;
  hoje: Date;
  // Com busca, todos os resultados aparecem.
  semLimite?: boolean;
  onVerFicha: (mensalista: Mensalista) => void;
  onAcao: (item: AgendaItemData, acao: AgendaAcao) => void;
  // Mensalista cujo contrato está sendo reenviado.
  reenviandoId?: number | null;
}

export function AgendaGrupo({ grupo, hoje, semLimite = false, onVerFicha, onAcao, reenviandoId = null }: AgendaGrupoProps) {
  const tituloId = useId();
  const [expandido, setExpandido] = useState(false);
  const limitavel = !semLimite && !SEMPRE_INTEIROS.includes(grupo.id) && grupo.itens.length > LIMITE;
  const itens = limitavel && !expandido ? grupo.itens.slice(0, LIMITE) : grupo.itens;
  const restantes = grupo.itens.length - LIMITE;

  return (
    <GrupoSection aria-labelledby={tituloId} data-agenda-grupo={grupo.id}>
      <GrupoTitulo>
        <h3 id={tituloId} tabIndex={-1}>
          {grupo.titulo}
        </h3>
        {grupo.id === "atrasados" ? (
          <StatusBadge tone="danger">{`${grupo.itens.length}`}</StatusBadge>
        ) : (
          <Contagem>{limitavel && !expandido ? `${itens.length} de ${grupo.itens.length}` : grupo.itens.length}</Contagem>
        )}
      </GrupoTitulo>
      <Lista>
        {itens.map((item) => (
          <AgendaItem
            key={item.mensalista.mensalistaId}
            item={item}
            hoje={hoje}
            onVerFicha={onVerFicha}
            onAcao={onAcao}
            reenviando={reenviandoId === item.mensalista.mensalistaId}
          />
        ))}
      </Lista>
      {limitavel && (
        <MaisBotao type="button" variant="secondary" size="sm" aria-expanded={expandido} onClick={() => setExpandido((valor) => !valor)}>
          {expandido ? "Mostrar menos" : `Ver os outros ${restantes}`}
        </MaisBotao>
      )}
    </GrupoSection>
  );
}
