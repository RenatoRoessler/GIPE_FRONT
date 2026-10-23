"use client";

import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import type { Caixa } from "@/types/caixa";
import { ActionBar, HeaderRow, StatusLine } from "./Caixa.styles";
import { formatDateTime } from "./format";

export interface CaixaHeaderProps {
  caixa: Caixa;
  // Retirada, passagem e fechamento dependem dos dados do turno atual.
  turnoPronto: boolean;
  onPassarTurno: () => void;
  onHistorico: () => void;
  onFechar: () => void;
}

export function CaixaHeader({
  caixa,
  turnoPronto,
  onPassarTurno,
  onHistorico,
  onFechar,
}: CaixaHeaderProps) {
  const podeCaixasAnteriores = useCan(AREA.CaixaHistorico);

  return (
    <HeaderRow>
      <StatusLine>
        <StatusBadge tone="success">Caixa aberto</StatusBadge>
        <span>desde {formatDateTime(caixa.dataHoraAbertura)}</span>
        {podeCaixasAnteriores && <Link href="/caixa/historico">Caixas anteriores</Link>}
      </StatusLine>
      <ActionBar>
        <Button type="button" variant="secondary" onClick={onPassarTurno} disabled={!turnoPronto}>
          Passar turno
        </Button>
        <Button type="button" variant="secondary" onClick={onHistorico}>
          Histórico de turnos
        </Button>
        <Button type="button" variant="danger" onClick={onFechar} disabled={!turnoPronto}>
          Fechar caixa
        </Button>
      </ActionBar>
    </HeaderRow>
  );
}
