"use client";

import { formatDate } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StageTrack, type StageTrackProps } from "@/components/ui/StageTrack";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/StatusBadge";
import type { SituacaoMensalista as Situacao } from "@/types/mensalista";
import { Actions, BadgeRow, Detail, Wrapper } from "./SituacaoMensalista.styles";

type Stages = StageTrackProps["stages"];

const TRACK = {
  cadastro: "Cadastro",
  contrato: "Contrato",
  pagamento: "Pagamento",
} as const;

function stages(cadastro: Stages[number]["state"], contrato: Stages[number]["state"], pagamento: Stages[number]["state"]): Stages {
  return [
    { label: TRACK.cadastro, state: cadastro },
    { label: TRACK.contrato, state: contrato },
    { label: TRACK.pagamento, state: pagamento },
  ];
}

type Apresentacao = {
  label: string;
  tone: NonNullable<StatusBadgeProps["tone"]>;
  detail?: string;
  stages?: Stages;
  trackTone?: StageTrackProps["tone"];
  // Rótulo da ação de contrato oferecida na linha.
  action?: "Reenviar" | "Enviar contrato";
};

export function apresentarSituacao(situacao: Situacao): Apresentacao | null {
  switch (situacao.kind) {
    case "ativo":
      return { label: "Ativo", tone: "success", stages: stages("done", "done", "done"), trackTone: "success" };
    case "aguardando-aceite":
      return {
        label: "Aguardando aceite",
        tone: "info",
        detail: situacao.expiraEm ? `Enviado · link vence em ${formatDate(situacao.expiraEm)}` : "Contrato enviado",
        stages: stages("done", "current", "todo"),
        action: "Reenviar",
      };
    case "link-vencido":
      return {
        label: "Link do contrato vencido",
        tone: "warn",
        detail: "Reenvie o link ao mensalista",
        stages: stages("done", "attention", "todo"),
        action: "Reenviar",
      };
    case "aguardando-pagamento":
      return {
        label: "Aguardando 1º pagamento",
        tone: "info",
        detail: situacao.aceitoEm ? `Contrato aceito em ${formatDate(situacao.aceitoEm)}` : "Contrato aceito",
        stages: stages("done", "done", "current"),
      };
    case "sem-contrato":
      return {
        label: "Sem contrato",
        tone: "neutral",
        detail: "Envie o contrato para o mensalista aceitar",
        stages: stages("done", "todo", "todo"),
        action: "Enviar contrato",
      };
    case "inativo":
    case "desconhecida":
      return { label: "Inativo", tone: "neutral" };
    case "carregando":
      return null;
  }
}

export interface SituacaoMensalistaProps {
  situacao: Situacao;
  // Para o nome acessível da trilha e da ação.
  nome: string;
  // Sem isto (ou com `somenteLeitura`) a ação de contrato não aparece.
  onReenviar?: () => void;
  reenviando?: boolean;
  somenteLeitura?: boolean;
}

export function SituacaoMensalista({
  situacao,
  nome,
  onReenviar,
  reenviando = false,
  somenteLeitura = false,
}: SituacaoMensalistaProps) {
  const apresentacao = apresentarSituacao(situacao);

  if (!apresentacao) {
    return (
      <Wrapper role="status" aria-label="Carregando situação do contrato">
        <Skeleton width="120px" height="36px" />
      </Wrapper>
    );
  }

  const { label, tone, detail, stages: etapas, trackTone, action } = apresentacao;
  const podeAgir = Boolean(action && onReenviar && !somenteLeitura);

  return (
    <Wrapper>
      {etapas && <StageTrack stages={etapas} size="sm" tone={trackTone} label={`Situação de ${nome}`} />}
      <BadgeRow>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </BadgeRow>
      {detail && <Detail>{detail}</Detail>}
      {podeAgir && (
        <Actions>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={reenviando}
            aria-label={`${action} ${action === "Reenviar" ? "contrato " : ""}para ${nome}`}
            onClick={onReenviar}
          >
            {reenviando ? "Reenviando…" : action}
          </Button>
        </Actions>
      )}
    </Wrapper>
  );
}
