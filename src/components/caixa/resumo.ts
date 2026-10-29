import { FORMA_PAGAMENTO, type Caixa } from "@/types/caixa";
import { arredondar, proporcao, type TotalForma } from "./agregados";
import { formaPagamentoLabel } from "./format";

// Chave da cor da forma: as quatro principais vêm de `colors.pagamento`; as demais usam `colors.steel`.
export type CorForma = "dinheiro" | "pix" | "debito" | "credito" | "steel";

export type FormaDoResumo = {
  formaPagamento: number;
  rotulo: string;
  cor: CorForma;
  valor: number;
  quantidade: number;
  // Parte (0 a 100) do total recebido; nunca NaN.
  percentual: number;
};

const FORMAS_FIXAS: readonly { formaPagamento: number; cor: CorForma }[] = [
  { formaPagamento: FORMA_PAGAMENTO.Dinheiro, cor: "dinheiro" },
  { formaPagamento: FORMA_PAGAMENTO.Pix, cor: "pix" },
  { formaPagamento: FORMA_PAGAMENTO.CartaoDebito, cor: "debito" },
  { formaPagamento: FORMA_PAGAMENTO.CartaoCredito, cor: "credito" },
];

function numeroOuZero(valor: number | null | undefined): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

// Valor em caixa = saldo do caixa (entradas menos saídas, como a API informa) mais o fundo de caixa.
// Regra isolada aqui: se o produto decidir que as saídas não reduzem o valor, só esta função muda.
export function valorEmCaixa(caixa: Caixa): number {
  const entradas = numeroOuZero(caixa.valorTotalEntrada);
  const saidas = numeroOuZero(caixa.valorTotalSaida);
  const saldo = typeof caixa.saldoAtual === "number" && Number.isFinite(caixa.saldoAtual) ? caixa.saldoAtual : entradas - saidas;
  return arredondar(saldo + numeroOuZero(caixa.valorFundoCaixa));
}

// Um ticket por movimento de entrada (ver riscos do techspec).
export function totalDeTickets(totais: TotalForma[]): number {
  return totais.reduce((soma, total) => soma + total.quantidade, 0);
}

// Dinheiro, Pix, Débito e Crédito sempre aparecem, mesmo zerados; as outras formas só com entrada.
export function formasDoResumo(totais: TotalForma[]): FormaDoResumo[] {
  const porForma = new Map(totais.map((total) => [total.formaPagamento, total]));
  const fixas = new Set(FORMAS_FIXAS.map((forma) => forma.formaPagamento));
  const extras = totais
    .filter((total) => !fixas.has(total.formaPagamento) && total.entradas > 0)
    .sort((a, b) => a.formaPagamento - b.formaPagamento)
    .map((total) => ({ formaPagamento: total.formaPagamento, cor: "steel" as CorForma }));

  const lista = [...FORMAS_FIXAS, ...extras].map(({ formaPagamento, cor }) => {
    const total = porForma.get(formaPagamento);
    return {
      formaPagamento,
      rotulo: formaPagamentoLabel(formaPagamento),
      cor,
      valor: total?.entradas ?? 0,
      quantidade: total?.quantidade ?? 0,
    };
  });
  const recebido = lista.reduce((soma, forma) => soma + forma.valor, 0);
  return lista.map((forma) => ({ ...forma, percentual: proporcao(forma.valor, recebido) }));
}
