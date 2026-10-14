"use client";

import { formatDateTime } from "@/components/caixa/format";
import { formatMinutos } from "@/components/precos/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatBRL } from "@/lib/money";
import type { SaidaConsulta } from "@/types/saida";
import { getCategoriaVeiculoLabel } from "../saida";
import { Hint, DataList, PlacaTitle, ValueAmount, ValueLabel, ValuePanel, VehicleHeader } from "../Saida.styles";

export function ConferirSaidaStep({ consulta }: { consulta: SaidaConsulta }) {
  return (
    <>
      <VehicleHeader>
        <PlacaTitle>{consulta.placa}</PlacaTitle>
        {consulta.mensalista && <StatusBadge tone="info">Mensalista</StatusBadge>}
      </VehicleHeader>
      <DataList>
        <div>
          <dt>Modelo</dt>
          <dd>{consulta.modelo || "—"}</dd>
        </div>
        <div>
          <dt>Cor</dt>
          <dd>{consulta.cor || "—"}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{getCategoriaVeiculoLabel(consulta.categoria)}</dd>
        </div>
        <div>
          <dt>Código do ticket</dt>
          <dd>{consulta.codigoTicket}</dd>
        </div>
        <div>
          <dt>Sequencial</dt>
          <dd>{consulta.sequencial}</dd>
        </div>
        <div>
          <dt>Tabela de preço</dt>
          <dd>{consulta.rotatividadeDescricao || "—"}</dd>
        </div>
        <div>
          <dt>Entrada</dt>
          <dd>{formatDateTime(consulta.dataHoraEntrada)}</dd>
        </div>
        <div>
          <dt>Saída (momento da consulta)</dt>
          <dd>{formatDateTime(consulta.dataHoraSaida)}</dd>
        </div>
        <div>
          <dt>Permanência</dt>
          <dd>{formatMinutos(consulta.minutosPermanencia)}</dd>
        </div>
      </DataList>
      <ValuePanel>
        <ValueLabel>Valor a cobrar</ValueLabel>
        <ValueAmount>{formatBRL(consulta.valor)}</ValueAmount>
      </ValuePanel>
      <Hint>
        O valor é calculado até o momento da consulta e será conferido novamente antes de registrar a saída.
      </Hint>
    </>
  );
}
