import { formatBRL } from "@/lib/money";
import { FORMA_PAGAMENTO_OPTIONS, type Caixa, type Turno } from "@/types/caixa";

export function formaPagamentoLabel(id: number): string {
  return FORMA_PAGAMENTO_OPTIONS.find((option) => option.value === id)?.label ?? `Forma ${id}`;
}

export function isCaixaAberto(caixa: Caixa): boolean {
  // Aberto = sem data de fechamento; a API omite o campo (undefined) em vez de enviar null.
  return !caixa.dataHoraFechamento;
}

export function isTurnoAberto(turno: Turno): boolean {
  return turno.dataHoraFim === null;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const timeOnly = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

// A API devolve data/hora sem fuso (microssegundos incluídos); trata como horário local.
function parseApiDate(iso: string | null): Date | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(iso: string | null): string {
  const date = parseApiDate(iso);
  return date ? dateTime.format(date) : "—";
}

export function formatDate(iso: string | null): string {
  const date = parseApiDate(iso);
  return date ? dateOnly.format(date) : "—";
}

export function formatTime(iso: string | null): string {
  const date = parseApiDate(iso);
  return date ? timeOnly.format(date) : "—";
}

export type DiferencaTone = "success" | "neutral" | "warn";

export type DiferencaInfo = { label: string; tone: DiferencaTone; value: string };

// Diferença = informado − esperado: positiva é sobra, negativa é falta.
export function describeDiferenca(diferenca: number | null): DiferencaInfo | null {
  if (diferenca === null) {
    return null;
  }
  if (diferenca === 0) {
    return { label: "Sem diferença", tone: "neutral", value: formatBRL(0) };
  }
  return diferenca > 0
    ? { label: "Sobra", tone: "success", value: formatBRL(diferenca) }
    : { label: "Falta", tone: "warn", value: formatBRL(Math.abs(diferenca)) };
}
