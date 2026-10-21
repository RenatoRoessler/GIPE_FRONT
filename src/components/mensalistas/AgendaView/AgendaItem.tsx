"use client";

import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/StatusBadge";
import type { AgendaItemData, Mensalista } from "@/types/mensalista";
import { acaoDoItem, acaoEhPrincipal, diasEntre, formatDiaMes, nomeDoDia, type AgendaAcao } from "../agenda";
import { formatCategoria, formatValor } from "../format";
import { apresentarSituacao } from "../SituacaoMensalista";
import {
  Acao,
  AcaoBotao,
  Complemento,
  Data,
  Info,
  Item,
  Nome,
  NomeBotao,
  Placas,
  Sub,
  SubTipo,
  Valor,
  Vencimento,
} from "./AgendaView.styles";

const MAX_PLACAS = 2;
const MAX_PLACAS_CELULAR = 1;

export interface AgendaItemProps {
  item: AgendaItemData;
  // Dia de referência da agenda, para "em N dias".
  hoje: Date;
  onVerFicha: (mensalista: Mensalista) => void;
  onAcao: (item: AgendaItemData, acao: AgendaAcao) => void;
  // A ação de contrato deste item está em andamento.
  reenviando?: boolean;
}

type Motivo = { label: string; tone: NonNullable<StatusBadgeProps["tone"]> };

// Quem espera o primeiro pagamento não tem data de cobrança: o selo diz o que falta.
function motivoDoItem(item: AgendaItemData): Motivo | null {
  switch (item.situacao.kind) {
    case "aguardando-pagamento":
      return { label: "1º pagamento", tone: "info" };
    case "aguardando-aceite":
      return { label: "Contrato", tone: "warn" };
    case "link-vencido":
      return { label: "Link vencido", tone: "danger" };
    case "sem-contrato":
      return { label: "Sem contrato", tone: "neutral" };
    case "desconhecida":
      return { label: "Aguardando", tone: "neutral" };
    default:
      return null;
  }
}

function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

const ROTULO: Record<AgendaAcao, string> = {
  receber: "Receber",
  reenviar: "Reenviar",
  "enviar-contrato": "Enviar contrato",
};

function nomeAcessivel(acao: AgendaAcao, nome: string): string {
  if (acao === "receber") return `Receber de ${nome}`;
  return `${acao === "reenviar" ? "Reenviar" : "Enviar"} contrato para ${nome}`;
}

function VencimentoDoItem({ item, hoje }: { item: AgendaItemData; hoje: Date }) {
  if (item.grupo === "sem-pagamento") {
    const motivo = motivoDoItem(item);
    return motivo ? (
      <StatusBadge tone={motivo.tone}>{motivo.label}</StatusBadge>
    ) : (
      <Skeleton width="72px" height="20px" radius="9999px" />
    );
  }
  if (!item.vence) {
    return (
      <>
        <Data>—</Data>
        <Complemento>{item.grupo === "inativos" ? "Inativo" : "Sem cobrança"}</Complemento>
      </>
    );
  }
  const dias = diasEntre(hoje, item.vence);
  return (
    <>
      <Data>{formatDiaMes(item.vence)}</Data>
      {item.grupo === "atrasados" ? (
        <StatusBadge tone="danger">{`${plural(item.diasAtraso, "dia", "dias")} de atraso`}</StatusBadge>
      ) : (
        <Complemento>{dias === 0 ? "hoje" : dias <= 6 ? nomeDoDia(item.vence) : `em ${dias} dias`}</Complemento>
      )}
    </>
  );
}

export function AgendaItem({ item, hoje, onVerFicha, onAcao, reenviando = false }: AgendaItemProps) {
  const { mensalista } = item;
  const acao = acaoDoItem(item);
  const fato = item.grupo === "sem-pagamento" ? apresentarSituacao(item.situacao)?.detail : undefined;
  const celular = useIsMobile();
  const placas = mensalista.veiculos.slice(0, celular ? MAX_PLACAS_CELULAR : MAX_PLACAS);
  const restantes = mensalista.veiculos.length - placas.length;

  return (
    <Item data-agenda-item={mensalista.mensalistaId}>
      <Nome>
        <NomeBotao
          type="button"
          onClick={() => onVerFicha(mensalista)}
          aria-label={`Ver ficha de ${mensalista.nome}`}
          data-agenda-nome={mensalista.mensalistaId}
        >
          {mensalista.nome}
        </NomeBotao>
        {/* Tipo e categoria só no computador; no celular a linha mostra o vencimento, e o tipo está na ficha. */}
        <SubTipo>{[mensalista.tipoMensal, formatCategoria(mensalista.categoria)].join(" · ")}</SubTipo>
        {fato && <Sub>{fato}</Sub>}
      </Nome>
      <Info>
        <Vencimento>
          <VencimentoDoItem item={item} hoje={hoje} />
        </Vencimento>
        <Placas>
          {placas.map((veiculo) => (
            <PlateDisplay key={veiculo.placa} value={veiculo.placa} size="sm" />
          ))}
          {restantes > 0 && <StatusBadge tone="neutral">{`+${restantes}`}</StatusBadge>}
        </Placas>
        <Valor>{formatValor(mensalista.valorMensalidade)}</Valor>
      </Info>
      <Acao>
        {acao && (
          <AcaoBotao
            type="button"
            size="sm"
            $contorno={!acaoEhPrincipal(item, acao)}
            variant={acaoEhPrincipal(item, acao) ? "primary" : "secondary"}
            disabled={reenviando}
            aria-label={nomeAcessivel(acao, mensalista.nome)}
            onClick={() => onAcao(item, acao)}
          >
            {reenviando ? "Reenviando…" : ROTULO[acao]}
          </AcaoBotao>
        )}
      </Acao>
    </Item>
  );
}
