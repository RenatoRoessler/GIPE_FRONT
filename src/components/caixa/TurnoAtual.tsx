"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { formatBRL } from "@/lib/money";
import type { Turno } from "@/types/caixa";
import { InfoList, Panel, PanelTitle, VisuallyHidden } from "./Caixa.styles";
import { formaPagamentoLabel, formatDateTime } from "./format";

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
          <dt>Valor inicial</dt>
          <dd>{formatBRL(turno.valorInicial)}</dd>
        </div>
        <div>
          <dt>Troco padrão</dt>
          <dd>{formatBRL(turno.trocoPadrao ?? 0)}</dd>
        </div>
        <div>
          <dt>Disponível para retirada</dt>
          <dd>{formatBRL(turno.disponivelSangria ?? 0)}</dd>
        </div>
      </InfoList>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>Forma de pagamento</TableCell>
            <TableCell head align="right">
              Entradas
            </TableCell>
            <TableCell head align="right">
              Saídas
            </TableCell>
            <TableCell head align="right">
              Esperado
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {turno.formasPagamento.map((forma) => (
            <TableRow key={forma.formaPagamento}>
              <TableCell data-label="Forma de pagamento">{formaPagamentoLabel(forma.formaPagamento)}</TableCell>
              <TableCell align="right" numeric data-label="Entradas">
                {formatBRL(forma.entradas)}
              </TableCell>
              <TableCell align="right" numeric data-label="Saídas">
                {formatBRL(forma.saidas)}
              </TableCell>
              <TableCell align="right" numeric data-label="Esperado">
                {formatBRL(forma.valorEsperado)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Text variant="muted">No dinheiro, o valor esperado inclui o valor inicial do turno.</Text>
    </Panel>
  );
}
