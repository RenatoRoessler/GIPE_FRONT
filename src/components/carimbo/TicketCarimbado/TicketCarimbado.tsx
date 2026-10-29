"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Carimbo } from "@/types/carimbo";
import { categoriaDoCarimbo, corDoCarimbo, formatDateTime, textoOuTraco } from "../format";
import { Acoes, Dados, Descricao, Ticket, Titulo, Topo, Veiculo } from "./TicketCarimbado.styles";

export interface TicketCarimbadoProps {
  carimbo: Carimbo;
  // Volta ao leitor para carimbar o próximo ticket.
  onOutro: () => void;
}

// Resultado do carimbo: o ticket com a placa, a tabela de convênio aplicada e o momento do carimbo.
export function TicketCarimbado({ carimbo, onOutro }: TicketCarimbadoProps) {
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // O foco vai ao título: o leitor de tela anuncia o resultado e o teclado parte dele.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  const descricao = [textoOuTraco(carimbo.modelo), corDoCarimbo(carimbo.cor)].join(" · ");

  return (
    <Ticket role="status" aria-label="Resultado do carimbo">
      <Topo>
        <Titulo ref={tituloRef} tabIndex={-1}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
          </svg>
          Ticket carimbado
        </Titulo>
        <StatusBadge tone="conveniado">Convênio</StatusBadge>
      </Topo>

      <Veiculo>
        <PlateDisplay value={carimbo.placa} size="md" />
        <Descricao>{descricao}</Descricao>
      </Veiculo>

      <Dados>
        <dt>Estacionamento</dt>
        <dd>{textoOuTraco(carimbo.estacionamento)}</dd>
        <dt>Categoria</dt>
        <dd>{categoriaDoCarimbo(carimbo.categoria)}</dd>
        <dt>Entrada</dt>
        <dd>{formatDateTime(carimbo.dataHoraEntrada)}</dd>
        <dt>Tabela aplicada</dt>
        <dd>{textoOuTraco(carimbo.rotatividade)}</dd>
        <dt>Carimbado às</dt>
        <dd>{formatDateTime(carimbo.dataHoraConveniada)}</dd>
      </Dados>

      <Acoes>
        <Button type="button" onClick={onOutro}>
          Carimbar outro ticket
        </Button>
      </Acoes>
    </Ticket>
  );
}
