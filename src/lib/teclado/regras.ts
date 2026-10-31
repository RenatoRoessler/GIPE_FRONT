import { normalizePlaca } from "@/lib/placa";
import { aceitaAlfa, limparAlfa } from "./alfa";
import { aceitaNumerico, limparNumerico } from "./numerico";
import { aceitaPlaca } from "./placa";
import type { TecladoConfig } from "./tipos";

const MAX_PLACA = 7;
const MAX_NUMERICO = 20;
const MAX_ALFA = 40;

// Limite do teclado quando o campo não tem `maxLength`.
export function maxPadrao(config: TecladoConfig): number {
  switch (config.tipo) {
    case "placa":
      return MAX_PLACA;
    case "numerico":
      return MAX_NUMERICO;
    default:
      return MAX_ALFA;
  }
}

// Letra minúscula ou acentuada vira a maiúscula sem acento que o campo guarda; o resto passa como veio.
export function normalizarCaractere(config: TecladoConfig, ch: string): string {
  if (config.tipo === "numerico") {
    return ch;
  }
  const normalizado = ch.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
  return normalizado.length === 1 ? normalizado : ch;
}

// Mesma regra para a tecla de toque, o teclado físico (beforeinput) e o texto colado.
export function aceitaCaractere(config: TecladoConfig, valor: string, ch: string, max: number): boolean {
  switch (config.tipo) {
    case "placa":
      return valor.length < max && aceitaPlaca(ch, normalizePlaca(valor).length);
    case "numerico":
      return aceitaNumerico(config.modo, valor, ch, max);
    default:
      return aceitaAlfa(valor, ch, max);
  }
}

export function limparTexto(config: TecladoConfig, texto: string, max: number): string {
  switch (config.tipo) {
    case "placa": {
      let resultado = "";
      for (const ch of texto) {
        if (aceitaCaractere(config, resultado, ch, max)) {
          resultado += ch.toUpperCase();
        }
      }
      return resultado;
    }
    case "numerico":
      return limparNumerico(config.modo, texto, max);
    default:
      return limparAlfa(texto, max);
  }
}
