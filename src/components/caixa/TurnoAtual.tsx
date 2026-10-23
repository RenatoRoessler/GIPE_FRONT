"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import type { Turno } from "@/types/caixa";
import { InfoList, Panel, PanelTitle, VisuallyHidden } from "./Caixa.styles";
import { formatDateTime, formatMoeda } from "./format";
import { FormasPagamentoTabela } from "./FormasPagamentoTabela";

export interface TurnoAtualProps {
  // undefined = carregando; null = não há turno aberto.
  turno: Turno | null | undefined;
}

export function TurnoAtual({ turno }: TurnoAtualProps) {
  if (turno === undefined) {
    return (
      <Panel role="status" aria-busy="true">
        <VisuallyHidden>Carregando turno atual…</VisuallyHidden>
        <Skeleton width="30%" height="20px" />
        <Skeleton height="120px" />
      </Panel>
    );
  }

  if (turno === null) {
    return (
      <Panel>
        <PanelTitle>Turno atual</PanelTitle>
        <Text variant="muted">Não há turno aberto.</Text>
      </Panel>
    );
  }

  return (
    <Panel aria-labelledby="turno-atual-title">
      <PanelTitle id="turno-atual-title">Turno atual</PanelTitle>
      <InfoList>
        <div>
          <dt>Responsável</dt>
          <dd>{turno.usuario}</dd>
        </div>
        <div>
          <dt>Início</dt>
          <dd>{formatDateTime(turno.dataHoraInicio)}</dd>
        </div>
        <div>
          <dt>Fundo do turno</dt>
          <dd>{formatMoeda(turno.valorFundoCaixa)}</dd>
        </div>
      </InfoList>
      <FormasPagamentoTabela formas={turno.formasPagamento} />
      <Text variant="muted">No dinheiro, o esperado não inclui o fundo de caixa.</Text>
    </Panel>
  );
}
