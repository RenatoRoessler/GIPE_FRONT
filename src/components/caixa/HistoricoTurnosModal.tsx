"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { listTurnos } from "@/lib/api/services/caixa";
import { formatBRL } from "@/lib/money";
import type { Turno } from "@/types/caixa";
import { StatusRow, TurnoBlock, TurnoBlockHeader, VisuallyHidden } from "./Caixa.styles";
import { Diferenca } from "./Diferenca";
import { formaPagamentoLabel, formatDateTime, isTurnoAberto } from "./format";
import { CAIXA_KEY } from "./useCaixa";

function TurnoItem({ turno }: { turno: Turno }) {
  const aberto = isTurnoAberto(turno);

  return (
    <TurnoBlock>
      <TurnoBlockHeader>
        <strong>{turno.usuario}</strong>
        <StatusBadge tone={aberto ? "info" : "neutral"}>{aberto ? "Aberto" : "Fechado"}</StatusBadge>
      </TurnoBlockHeader>
      <Text variant="muted">
        {formatDateTime(turno.dataHoraInicio)} — {aberto ? "em andamento" : formatDateTime(turno.dataHoraFim)} ·
        valor inicial {formatBRL(turno.valorInicial)}
      </Text>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>Forma de pagamento</TableCell>
            <TableCell head align="right">
              Informado
            </TableCell>
            <TableCell head align="right">
              Diferença
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {turno.formasPagamento.map((forma) => (
            <TableRow key={forma.formaPagamento}>
              <TableCell data-label="Forma de pagamento">{formaPagamentoLabel(forma.formaPagamento)}</TableCell>
              <TableCell align="right" numeric data-label="Informado">
                {forma.valorInformado === null ? "—" : formatBRL(forma.valorInformado)}
              </TableCell>
              <TableCell align="right" numeric data-label="Diferença">
                <Diferenca value={forma.diferenca} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TurnoBlock>
  );
}

export function HistoricoTurnosModal({ onClose }: { onClose: () => void }) {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...CAIXA_KEY, "turnos"],
    queryFn: listTurnos,
  });

  return (
    <Modal
      open
      title="Histórico de turnos"
      size="lg"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {isPending ? (
        <div role="status" aria-busy="true">
          <VisuallyHidden>Carregando histórico de turnos…</VisuallyHidden>
          <Skeleton height="120px" />
        </div>
      ) : isError ? (
        <StatusRow>
          <ErrorBanner role="alert">{error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </StatusRow>
      ) : data.length === 0 ? (
        <Text variant="muted">Nenhum turno registrado neste caixa.</Text>
      ) : (
        data.map((turno) => <TurnoItem key={turno.turnoId} turno={turno} />)
      )}
    </Modal>
  );
}
