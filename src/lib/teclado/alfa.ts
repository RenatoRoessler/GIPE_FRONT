const CARACTERE_ALFA = /^[A-Z0-9.,-]$/;

export function aceitaAlfa(valorAtual: string, ch: string, max: number): boolean {
  if (ch.length !== 1 || valorAtual.length >= max) {
    return false;
  }
  if (ch === " ") {
    return valorAtual !== "" && !valorAtual.endsWith(" ");
  }
  return CARACTERE_ALFA.test(ch);
}

// Caixa alta e sem acento; o que sobra passa pelas mesmas regras da tecla.
export function limparAlfa(texto: string, max: number): string {
  const base = texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
  let resultado = "";
  for (const ch of base) {
    if (aceitaAlfa(resultado, ch, max)) {
      resultado += ch;
    }
  }
  return resultado;
}

// Tira o espaço que sobrou no fim ao avançar ou fechar.
export function aparar(texto: string): string {
  return texto.replace(/ +$/, "");
}
