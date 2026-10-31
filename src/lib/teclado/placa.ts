import { isValidPlaca, normalizePlaca } from "@/lib/placa";

export type TipoPosicaoPlaca = "L" | "N" | "LN";

// Posição é o índice (base 0) do próximo caractere: 3 letras, 1 número, letra ou número (Mercosul x antiga), 2 números.
export function tipoPosicaoPlaca(pos: number): TipoPosicaoPlaca | null {
  if (pos < 0 || pos > 6) {
    return null;
  }
  if (pos <= 2) {
    return "L";
  }
  return pos === 4 ? "LN" : "N";
}

export function aceitaPlaca(ch: string, pos: number): boolean {
  const tipo = tipoPosicaoPlaca(pos);
  const caractere = normalizePlaca(ch);
  if (tipo === null || ch.length !== 1 || caractere.length !== 1) {
    return false;
  }
  const ehNumero = /[0-9]/.test(caractere);
  return tipo === "LN" || (tipo === "N" ? ehNumero : !ehNumero);
}

export function placaCompletaValida(valor: string): boolean {
  return isValidPlaca(valor);
}
