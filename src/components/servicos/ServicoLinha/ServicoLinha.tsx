"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_SERVICO, type ServicoDoVeiculo } from "@/types/servico";
import { formatCentavos } from "../format";
import { STATUS_ROTULO, STATUS_TOM } from "../status";
import { Acoes, Direita, Icone, Item, Nome, Texto, Valor } from "./ServicoLinha.styles";

export interface ServicoLinhaProps {
  servico: ServicoDoVeiculo;
  // Abre o detalhe do serviço. Sem ele (ninguém pode agir neste serviço), o menu não aparece.
  onAcoes?: (servico: ServicoDoVeiculo) => void;
}

function IconeDoStatus({ status }: { status: ServicoDoVeiculo["status"] }) {
  const comum = { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
  if (status === STATUS_SERVICO.Pronto) {
    return (
      <svg {...comum}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }
  return (
    <svg {...comum}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

// Um serviço no cartão do ticket: nome e valor à esquerda, o status em texto (com ícone) e o menu à direita. O texto
// quebra em vez de empurrar a linha para fora da tela.
export function ServicoLinha({ servico, onAcoes }: ServicoLinhaProps) {
  return (
    <Item>
      <Texto>
        <Nome>{servico.nome}</Nome>
        <Valor>{formatCentavos(servico.valorCentavos)}</Valor>
      </Texto>
      <Direita>
        <StatusBadge tone={STATUS_TOM[servico.status]}>
          <Icone>
            <IconeDoStatus status={servico.status} />
          </Icone>
          {STATUS_ROTULO[servico.status]}
        </StatusBadge>
        {onAcoes && (
          <Acoes type="button" aria-label={`Ações de ${servico.nome}`} onClick={() => onAcoes(servico)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </Acoes>
        )}
      </Direita>
    </Item>
  );
}
