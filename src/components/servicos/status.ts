import type { StatusBadgeTone } from "@/components/ui/StatusBadge/StatusBadge.styles";
import { STATUS_SERVICO, type StatusServico } from "@/types/servico";

export const STATUS_ROTULO: Record<StatusServico, string> = {
  [STATUS_SERVICO.Aguardando]: "Na fila",
  [STATUS_SERVICO.EmExecucao]: "Em andamento",
  [STATUS_SERVICO.Pronto]: "Pronto",
  [STATUS_SERVICO.Cancelado]: "Cancelado",
};

// A cor só reforça: o estado sempre aparece em texto.
export const STATUS_TOM: Record<StatusServico, StatusBadgeTone> = {
  [STATUS_SERVICO.Aguardando]: "neutral",
  [STATUS_SERVICO.EmExecucao]: "warn",
  [STATUS_SERVICO.Pronto]: "success",
  [STATUS_SERVICO.Cancelado]: "danger",
};

// Status da fila, na ordem das colunas.
export const STATUS_DA_FILA = [STATUS_SERVICO.Aguardando, STATUS_SERVICO.EmExecucao, STATUS_SERVICO.Pronto] as const;
export type StatusDaFila = (typeof STATUS_DA_FILA)[number];

export interface AcaoDeStatus {
  rotulo: string;
  destino: StatusServico;
  // Só "Iniciar" e "Marcar como pronto" são o caminho normal; voltar é a correção de um engano.
  correcao: boolean;
}

// O que o botão principal do cartão faz em cada status. Cancelado não tem ação: o back não deixa mudá-lo.
export function acaoDeStatus(status: StatusServico): AcaoDeStatus | null {
  switch (status) {
    case STATUS_SERVICO.Aguardando:
      return { rotulo: "Iniciar", destino: STATUS_SERVICO.EmExecucao, correcao: false };
    case STATUS_SERVICO.EmExecucao:
      return { rotulo: "Marcar como pronto", destino: STATUS_SERVICO.Pronto, correcao: false };
    case STATUS_SERVICO.Pronto:
      return { rotulo: "Voltar para em andamento", destino: STATUS_SERVICO.EmExecucao, correcao: true };
    default:
      return null;
  }
}

// A segunda ação do cartão, discreta: desfazer o último passo. Só o serviço em andamento tem uma além da principal (voltar
// para a fila); em Pronto a principal já é a correção, e Na fila não há para onde voltar.
export function acaoSecundaria(status: StatusServico): AcaoDeStatus | null {
  return status === STATUS_SERVICO.EmExecucao ? { rotulo: "Voltar para a fila", destino: STATUS_SERVICO.Aguardando, correcao: true } : null;
}

// Só serviço Aguardando (ainda não iniciado) pode ser cancelado.
export function podeCancelar(status: StatusServico): boolean {
  return status === STATUS_SERVICO.Aguardando;
}

// Mensagem do aviso depois de trocar o status, para o Toast.
export function avisoDeStatus(destino: StatusServico): string {
  switch (destino) {
    case STATUS_SERVICO.Aguardando:
      return "Serviço voltou para a fila.";
    case STATUS_SERVICO.EmExecucao:
      return "Serviço em andamento.";
    case STATUS_SERVICO.Pronto:
      return "Serviço pronto.";
    default:
      return "Serviço atualizado.";
  }
}
