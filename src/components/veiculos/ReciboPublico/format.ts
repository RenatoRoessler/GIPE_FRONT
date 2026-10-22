// A consulta do recibo devolve o valor em reais (15100.00 = R$ 15.100,00), confirmado com o back. Único ponto que lê
// o campo: ausente, inválido ou negativo vira zero (recibo sem cobrança), sem quebrar a página.
export function valorDoRecibo(valor: number | null | undefined): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    return 0;
  }
  return Math.round(valor * 100) / 100;
}
