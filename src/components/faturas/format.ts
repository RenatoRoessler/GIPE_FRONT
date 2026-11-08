import { formatBRL } from "@/lib/money";
import type { Fatura, FaturaItem } from "@/types/fatura";

// "#12": o identificador único (GUID) não aparece na tela.
export function numeroFatura(fatura: Pick<Fatura, "convenioFaturaId">): string {
  return `#${fatura.convenioFaturaId}`;
}

// "1 saída" ou "14 saídas".
export function quantidadeSaidas(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "saída" : "saídas"}`;
}

// Regra da conveniada na saída: "50%", "R$ 12,00 fixo" ou "—" quando o back não trouxe nenhuma.
export function regraConveniada(item: Pick<FaturaItem, "percentualConveniada" | "valorFixoConveniada">): string {
  if (item.valorFixoConveniada !== null) {
    return `${formatBRL(item.valorFixoConveniada)} fixo`;
  }
  if (item.percentualConveniada !== null) {
    return `${String(item.percentualConveniada).replace(".", ",")}%`;
  }
  return "—";
}

// Texto do Toast depois de emitir: "Fatura emitida: 14 saídas, R$ 1.250,00."
export function mensagemEmissao(fatura: Pick<Fatura, "quantidadeSaidas" | "valorTotal">): string {
  return `Fatura emitida: ${quantidadeSaidas(fatura.quantidadeSaidas)}, ${formatBRL(fatura.valorTotal)}.`;
}

export const MENSAGEM_PAGAMENTO = "Pagamento registrado.";
export const MENSAGEM_CANCELAMENTO = "Fatura cancelada. As saídas voltaram a ficar em aberto.";
