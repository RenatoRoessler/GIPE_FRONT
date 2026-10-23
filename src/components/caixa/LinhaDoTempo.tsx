"use client";

import { formatDateTime } from "./format";
import type { EventoCaixa, TipoEvento } from "./eventosCaixa";
import { Corpo, Item, Lista, Marcador, Meta, Titulo } from "./LinhaDoTempo.styles";

const TOM: Record<TipoEvento, "primary" | "danger" | "steel" | "success"> = {
  abertura: "success",
  retirada: "danger",
  passagem: "primary",
  fechamento: "steel",
};

export interface LinhaDoTempoProps {
  eventos: EventoCaixa[];
}

// Eventos em ordem, do mais recente ao mais antigo. O marcador é só decoração: o tipo do evento está no título.
export function LinhaDoTempo({ eventos }: LinhaDoTempoProps) {
  return (
    <Lista aria-label="Eventos do caixa, do mais recente ao mais antigo">
      {eventos.map((evento) => (
        <Item key={evento.id}>
          <Marcador $tom={TOM[evento.tipo]} aria-hidden="true" />
          <Corpo>
            <Titulo>{evento.titulo}</Titulo>
            {evento.detalhe && <Meta>{evento.detalhe}</Meta>}
            <Meta>
              {formatDateTime(evento.dataHora)}
              {evento.autor && ` · ${evento.autor}`}
            </Meta>
          </Corpo>
        </Item>
      ))}
    </Lista>
  );
}
