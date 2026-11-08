import { formaPagamentoLabel } from "@/components/caixa/format";
import { formatDiaMes } from "@/components/financeiro/format";
import { formatBRL } from "@/lib/money";
import { SITUACAO_FATURA, type Fatura, type FaturaItem } from "@/types/fatura";

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

// Resumo de uma linha do ciclo, no cabeçalho recolhido do celular:
// "Emitida em 08/11 por Ana", "Paga em 12/11 · Pix · R$ 1.250,00" ou "Cancelada em 15/11 por Ana".
export function resumoCiclo(fatura: Fatura): string {
  const dia = (data: string | null) => (data ? ` em ${formatDiaMes(data.slice(0, 10))}` : "");
  const por = (usuario: string | null) => (usuario ? ` por ${usuario}` : "");

  if (fatura.situacao === SITUACAO_FATURA.Paga) {
    const forma = fatura.formaPagamento !== null ? formaPagamentoLabel(fatura.formaPagamento) : null;
    return [`Paga${dia(fatura.dataPagamento)}`, forma, formatBRL(fatura.valorPago ?? fatura.valorTotal)].filter(Boolean).join(" · ");
  }
  if (fatura.situacao === SITUACAO_FATURA.Cancelada) {
    return `Cancelada${dia(fatura.dataCancelamento)}${por(fatura.usuarioCancelamento)}`;
  }
  return `Emitida${dia(fatura.dataCriacao)}${por(fatura.usuario)}`;
}

export const MENSAGEM_PAGAMENTO = "Pagamento registrado.";
export const MENSAGEM_CANCELAMENTO = "Fatura cancelada. As saídas voltaram a ficar em aberto.";
