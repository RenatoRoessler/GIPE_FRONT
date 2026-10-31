import type { ModoNumerico } from "./tipos";

const CASAS_DECIMAIS = 2;

const CARACTERES: Record<ModoNumerico, RegExp> = {
  inteiro: /^[0-9]$/,
  decimal: /^[0-9,]$/,
  livre: /^[0-9,.-]$/,
};

// Campos com máscara de moeda ("R$ 1.234,5") entram aqui: só os dígitos e a vírgula contam para as regras do decimal.
function parteDecimal(valorAtual: string): { temVirgula: boolean; casas: number; temDigito: boolean } {
  const [inteiro, ...resto] = valorAtual.replace(/[^\d,]/g, "").split(",");
  return {
    temVirgula: resto.length > 0,
    casas: resto.join("").length,
    temDigito: inteiro.length > 0,
  };
}

export function aceitaNumerico(modo: ModoNumerico, valorAtual: string, ch: string, max: number): boolean {
  if (ch.length !== 1 || !CARACTERES[modo].test(ch) || valorAtual.length >= max) {
    return false;
  }
  if (modo !== "decimal") {
    return true;
  }
  const { temVirgula, casas, temDigito } = parteDecimal(valorAtual);
  if (ch === ",") {
    return !temVirgula && temDigito;
  }
  return !temVirgula || casas < CASAS_DECIMAIS;
}

// Texto colado: mantém, na ordem, só o que `aceitaNumerico` aceitaria digitado.
export function limparNumerico(modo: ModoNumerico, texto: string, max: number): string {
  let resultado = "";
  for (const ch of texto) {
    if (aceitaNumerico(modo, resultado, ch, max)) {
      resultado += ch;
    }
  }
  return resultado;
}
