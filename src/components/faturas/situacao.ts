import type { StatusBadgeTone } from "@/components/ui/StatusBadge/StatusBadge.styles";
import { SITUACAO_FATURA, type Fatura, type SituacaoFatura } from "@/types/fatura";

// A situação é sempre dita em texto; o tom do selo só reforça.
export const SITUACOES_FATURA: readonly { value: SituacaoFatura | null; label: string }[] = [
  { value: null, label: "Todas" },
  { value: SITUACAO_FATURA.Aberta, label: "Abertas" },
  { value: SITUACAO_FATURA.Paga, label: "Pagas" },
  { value: SITUACAO_FATURA.Cancelada, label: "Canceladas" },
];

export function rotuloSituacao(situacao: number): string {
  switch (situacao) {
    case SITUACAO_FATURA.Aberta:
      return "Aberta";
    case SITUACAO_FATURA.Paga:
      return "Paga";
    case SITUACAO_FATURA.Cancelada:
      return "Cancelada";
    default:
      return "Situação desconhecida";
  }
}

export function tomSituacao(situacao: number): StatusBadgeTone {
  switch (situacao) {
    case SITUACAO_FATURA.Aberta:
      return "warn";
    case SITUACAO_FATURA.Paga:
      return "success";
    default:
      return "neutral";
  }
}

// Só fatura aberta recebe pagamento ou cancelamento; o back continua sendo a autoridade.
export function podePagar(fatura: Pick<Fatura, "situacao">): boolean {
  return fatura.situacao === SITUACAO_FATURA.Aberta;
}

export function podeCancelar(fatura: Pick<Fatura, "situacao">): boolean {
  return fatura.situacao === SITUACAO_FATURA.Aberta;
}
