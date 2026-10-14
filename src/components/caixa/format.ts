import { formatBRL } from "@/lib/money";
import type { Caixa, Turno } from "@/types/caixa";

// [A DEFINIR] Os nomes das formas de pagamento (códigos 1 a 4) não constam no contrato; enquanto o backend
// não confirmar, a tela mostra "Forma n". Preencher aqui quando forem conhecidos.
const FORMA_PAGAMENTO_NOMES: Record<number, string> = {};

export function formaPagamentoLabel(id: number): string {
  return FORMA_PAGAMENTO_NOMES[id] ?? `Forma ${id}`;
}

export function isCaixaAberto(caixa: Caixa): boolean {
  return caixa.dataHoraFechamento === null;
}

export function isTurnoAberto(turno: Turno): boolean {
  return turno.dataHoraFim === null;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

// A API devolve data/hora sem fuso (microssegundos incluídos); trata como horário local.
export function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso.replace(/(\.\d{3})\d+/, "$1"));
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date);
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
