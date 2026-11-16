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

// Posição (base 0) do único caractere em que as duas placas diferem; null se forem iguais ou diferirem em mais de um.
function posicaoDoUnicoCaractereDiferente(a: string, b: string): number | null {
  if (a.length !== b.length) {
    return null;
  }
  let diferente: number | null = null;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      if (diferente !== null) {
        return null;
      }
      diferente = i;
    }
  }
  return diferente;
}

// Só confirma uma placa quando o mesmo valor aparece em leituras consecutivas; leitura sem placa zera a contagem.
// O reconhecedor só devolve texto (vazio quando a confiança dele é baixa), então a dúvida vem da divergência entre os
// quadros: se outra leitura válida diferia da confirmada em um único caractere, esse caractere é o que merece conferência.
export function criarConsenso(leiturasNecessarias = 2) {
  let atual: string | null = null;
  let repeticoes = 0;
  let outras: string[] = [];
  let duvida: number | null = null;

  return {
    registrar(placa: string | null): string | null {
      if (!placa) {
        // O quadro sem placa zera a contagem, mas a leitura anterior continua valendo como evidência de dúvida.
        if (atual !== null && !outras.includes(atual)) {
          outras.push(atual);
        }
        atual = null;
        repeticoes = 0;
        return null;
      }
      if (atual !== null && placa !== atual && !outras.includes(atual)) {
        outras.push(atual);
      }
      repeticoes = placa === atual ? repeticoes + 1 : 1;
      atual = placa;
      if (repeticoes < leiturasNecessarias) {
        return null;
      }
      duvida = null;
      for (const outra of outras) {
        const posicao = posicaoDoUnicoCaractereDiferente(placa, outra);
        if (posicao !== null) {
          duvida = posicao;
          break;
        }
      }
      return placa;
    },
    // Posição do caractere em dúvida na última placa confirmada; null quando as leituras sempre concordaram.
    duvida(): number | null {
      return duvida;
    },
    reiniciar() {
      atual = null;
      repeticoes = 0;
      outras = [];
      duvida = null;
    },
  };
}
