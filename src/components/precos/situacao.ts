import type { StatusBadgeTone } from "@/components/ui/StatusBadge";
import type { SituacaoPreco } from "@/types/preco";

export const SITUACAO_BADGE: Record<SituacaoPreco, { label: string; tone: StatusBadgeTone }> = {
  vigente: { label: "Vigente", tone: "success" },
  agendada: { label: "Agendada", tone: "info" },
  encerrada: { label: "Encerrada", tone: "neutral" },
  inativa: { label: "Inativa", tone: "neutral" },
};
