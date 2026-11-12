"use client";

import { formatTime } from "@/components/caixa/format";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import type { ItemFila } from "@/types/servico";
import { acaoDeStatus, podeCancelar, type AcaoDeStatus } from "../status";
import { Acao, Cancelar, Cartao, Detalhe, Entrada, NomeServico, Topo } from "./FilaCard.styles";

export interface FilaCardProps {
  item: ItemFila;
  // Só quem opera o pátio cancela.
  podeCancelarServico: boolean;
  onAcao: (item: ItemFila, acao: AcaoDeStatus) => void;
  onCancelar: (item: ItemFila) => void;
}

// Um serviço da fila: a placa identifica o veículo e há uma ação principal por status. Cancelar só existe enquanto o
// serviço não foi iniciado.
export function FilaCard({ item, podeCancelarServico, onAcao, onCancelar }: FilaCardProps) {
  const acao = acaoDeStatus(item.status);
  const veiculo = [item.modelo, item.cor, item.categoria].filter(Boolean).join(" · ");

  return (
    <Cartao aria-label={`${item.nomeServico}, placa ${item.placa}`}>
      <Topo>
        <PlateDisplay value={item.placa} size="sm" />
        {item.entradaEm && <Entrada>entrou {formatTime(item.entradaEm)}</Entrada>}
      </Topo>
      <NomeServico>{item.nomeServico}</NomeServico>
      {veiculo && <Detalhe>{veiculo}</Detalhe>}
      {item.prisma && <Detalhe>Prisma {item.prisma}</Detalhe>}
      {acao && (
        <Acao variant={acao.correcao ? "secondary" : "primary"} data-acao-card={item.patioServicoId} onClick={() => onAcao(item, acao)}>
          {acao.rotulo}
        </Acao>
      )}
      {podeCancelarServico && podeCancelar(item.status) && (
        <Cancelar type="button" onClick={() => onCancelar(item)}>
          Cancelar serviço
        </Cancelar>
      )}
    </Cartao>
  );
}
