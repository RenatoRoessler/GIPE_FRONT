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

export interface ReconhecedorPlaca {
  // Texto cru reconhecido na imagem (o recorte já deve conter só a placa).
  reconhecer: (imagem: HTMLCanvasElement) => Promise<string>;
  encerrar: () => Promise<void>;
}

const CARACTERES_PLACA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Cria o OCR sob demanda: o tesseract.js só é baixado aqui, e seus arquivos vêm de public/ocr (ver scripts/copy-ocr-assets.mjs).
export async function criarReconhecedorPlaca(): Promise<ReconhecedorPlaca> {
  const { default: Tesseract } = await import("tesseract.js");
  // O worker nasce de um blob, então os caminhos precisam ser absolutos.
  const base = `${window.location.origin}/ocr`;

  const worker = await Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
    workerPath: `${base}/worker.min.js`,
    corePath: `${base}/core`,
    langPath: `${base}/lang`,
  });
  await worker.setParameters({
    tessedit_char_whitelist: CARACTERES_PLACA,
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
  });

  return {
    reconhecer: async (imagem) => (await worker.recognize(imagem)).data.text,
    encerrar: async () => {
      await worker.terminate();
    },
  };
}
