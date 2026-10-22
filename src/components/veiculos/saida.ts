import { formaPagamentoLabel } from "@/components/caixa/format";
import { formatBRL, parseMoney } from "@/lib/money";
import type { PaymentsData } from "@/types/adesao";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import type { SaidaConsulta } from "@/types/saida";
import { CATEGORIA_VEICULO_OPTIONS } from "@/types/veiculo";

// Formas oferecidas na tela de saída; o caixa segue usando todas as de FORMA_PAGAMENTO_OPTIONS.
export const FORMAS_SAIDA = [
  { value: String(FORMA_PAGAMENTO.Dinheiro), label: "Dinheiro" },
  { value: String(FORMA_PAGAMENTO.CartaoCredito), label: "Crédito" },
  { value: String(FORMA_PAGAMENTO.CartaoDebito), label: "Débito" },
  { value: String(FORMA_PAGAMENTO.Pix), label: "Pix" },
] as const;

export type FormaSaida = (typeof FORMAS_SAIDA)[number];

export const FORMA_DINHEIRO = String(FORMA_PAGAMENTO.Dinheiro);
export const FORMA_PADRAO = FORMA_DINHEIRO;

// Chave da configuração da empresa (Minha Empresa) que liga ou desliga cada forma da saída.
export const CHAVE_DA_FORMA: Record<FormaSaida["value"], keyof PaymentsData> = {
  [String(FORMA_PAGAMENTO.Dinheiro)]: "dinheiro",
  [String(FORMA_PAGAMENTO.CartaoCredito)]: "cartaoCredito",
  [String(FORMA_PAGAMENTO.CartaoDebito)]: "cartaoDebito",
  [String(FORMA_PAGAMENTO.Pix)]: "pix",
};

// Mantém só as formas que a empresa aceita, na ordem da saída.
export function filtrarFormasAceitas(payments: PaymentsData): FormaSaida[] {
  return FORMAS_SAIDA.filter((forma) => payments[CHAVE_DA_FORMA[forma.value]]);
}

const toCents = (value: number) => Math.round(value * 100);

// Compara em centavos para não depender de ponto flutuante.
export function valoresIguais(a: number, b: number): boolean {
  return toCents(a) === toCents(b);
}

// Mensalista não paga a saída: este é o valor exibido, comparado e enviado.
export function valorACobrar(consulta: Pick<SaidaConsulta, "mensalista" | "valor">): number {
  return consulta.mensalista ? 0 : consulta.valor;
}

export function calcularTroco(recebido: number, valor: number): number {
  return Math.max(0, (toCents(recebido) - toCents(valor)) / 100);
}

export function getCategoriaVeiculoLabel(categoria: number): string {
  return CATEGORIA_VEICULO_OPTIONS.find((option) => option.value === categoria)?.label ?? `Categoria ${categoria}`;
}

export function getFormaPagamentoLabel(forma: number): string {
  return formaPagamentoLabel(forma);
}

// Situação do pagamento em dinheiro; também decide se o botão de confirmar pode ser usado.
export function getPagamentoStatus(forma: string, recebido: string, valor: number) {
  if (forma === "") {
    return { canConfirm: false, motivo: "Selecione a forma de pagamento para continuar." };
  }
  if (forma !== FORMA_DINHEIRO) {
    return { canConfirm: true, motivo: undefined };
  }
  const valorRecebido = parseMoney(recebido);
  if (Number.isNaN(valorRecebido)) {
    return { canConfirm: false, motivo: "Informe o valor recebido." };
  }
  if (toCents(valorRecebido) < toCents(valor)) {
    return { canConfirm: false, motivo: `Faltam ${formatBRL(valor - valorRecebido)}.` };
  }
  return { canConfirm: true, motivo: undefined };
}
