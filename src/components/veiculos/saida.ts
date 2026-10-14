import { formaPagamentoLabel } from "@/components/caixa/format";
import { CATEGORIA_VEICULO_OPTIONS } from "@/types/veiculo";

const toCents = (value: number) => Math.round(value * 100);

// Compara em centavos para não depender de ponto flutuante.
export function valoresIguais(a: number, b: number): boolean {
  return toCents(a) === toCents(b);
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
