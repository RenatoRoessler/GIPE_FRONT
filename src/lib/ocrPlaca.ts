import { isValidPlaca } from "@/lib/placa";

const DIGITO_PARA_LETRA: Record<string, string> = { "0": "O", "1": "I", "5": "S", "8": "B" };
const LETRA_PARA_DIGITO: Record<string, string> = { O: "0", I: "1", S: "5", B: "8" };

const TAMANHO_PLACA = 7;
// Posições (base 0) que só podem ser dígito; as 3 primeiras são sempre letras e a 5ª define o padrão.
const POSICOES_DIGITO = [3, 5, 6];

function corrigirJanela(janela: string): string {
  return Array.from(janela, (caractere, posicao) => {
    if (posicao < 3) {
      return DIGITO_PARA_LETRA[caractere] ?? caractere;
    }
    return POSICOES_DIGITO.includes(posicao) ? (LETRA_PARA_DIGITO[caractere] ?? caractere) : caractere;
  }).join("");
}

// Procura uma placa válida no texto reconhecido, corrigindo confusões típicas de OCR só onde o tipo do caractere é conhecido.
export function extrairPlaca(texto: string): string | null {
  const limpo = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");

  for (let inicio = 0; inicio + TAMANHO_PLACA <= limpo.length; inicio += 1) {
    const candidata = corrigirJanela(limpo.slice(inicio, inicio + TAMANHO_PLACA));
    if (isValidPlaca(candidata)) {
      return candidata;
    }
  }
  return null;
}

// Só confirma uma placa quando o mesmo valor aparece em leituras consecutivas; leitura sem placa zera a contagem.
export function criarConsenso(leiturasNecessarias = 2) {
  let atual: string | null = null;
  let repeticoes = 0;

  return {
    registrar(placa: string | null): string | null {
      if (!placa) {
        atual = null;
        repeticoes = 0;
        return null;
      }
      repeticoes = placa === atual ? repeticoes + 1 : 1;
      atual = placa;
      return repeticoes >= leiturasNecessarias ? placa : null;
    },
    reiniciar() {
      atual = null;
      repeticoes = 0;
    },
  };
}
