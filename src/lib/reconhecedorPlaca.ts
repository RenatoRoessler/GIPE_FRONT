// Reconhecimento de placa no próprio aparelho: um detector acha a placa no quadro da câmera e um leitor
// transforma o recorte em texto. Modelos em public/ocr/modelos; runtime WASM em public/ocr/ort
// (ver scripts/copy-ocr-assets.mjs). Nenhuma imagem sai do aparelho.

export interface ReconhecedorPlaca {
  // Texto da placa visível no quadro atual do vídeo; vazio quando não há placa ou a leitura é incerta.
  reconhecer: (video: HTMLVideoElement) => Promise<string>;
  encerrar: () => Promise<void>;
}

const LADO_DETECTOR = 512;
const LARGURA_LEITOR = 128;
const ALTURA_LEITOR = 64;
const ALFABETO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_";
const CARACTERE_VAZIO = "_";
const POSICOES_PLACA = 10;
const COLUNAS_DETECCAO = 7;
const CONFIANCA_DETECCAO = 0.4;
const CONFIANCA_LEITURA = 0.8;
const CINZA_BORDA = 114;
// Folga ao recortar a placa detectada, para não cortar as bordas dos caracteres.
const FOLGA_X = 0.04;
const FOLGA_Y = 0.06;

export interface Letterbox {
  escala: number;
  deslocX: number;
  deslocY: number;
  largura: number;
  altura: number;
}

// Encaixa a imagem em um quadrado mantendo a proporção, com bordas nos lados que sobram.
export function calcularLetterbox(largura: number, altura: number, lado: number): Letterbox {
  const escala = Math.min(lado / largura, lado / altura);
  const larguraFinal = Math.round(largura * escala);
  const alturaFinal = Math.round(altura * escala);
  return {
    escala,
    deslocX: Math.floor((lado - larguraFinal) / 2),
    deslocY: Math.floor((lado - alturaFinal) / 2),
    largura: larguraFinal,
    altura: alturaFinal,
  };
}

export interface Caixa {
  esquerda: number;
  topo: number;
  largura: number;
  altura: number;
  confianca: number;
}

// Cada linha do detector é [lote, x1, y1, x2, y2, classe, confiança], em pixels do quadrado de entrada.
// Devolve a detecção mais confiante, já nas coordenadas da imagem original e dentro dos limites dela.
export function melhorDeteccao(
  dados: ArrayLike<number>,
  linhas: number,
  letterbox: Letterbox,
  larguraOrigem: number,
  alturaOrigem: number,
): Caixa | null {
  let melhor: Caixa | null = null;

  for (let i = 0; i < linhas; i += 1) {
    const base = i * COLUNAS_DETECCAO;
    const confianca = dados[base + 6];
    if (confianca < CONFIANCA_DETECCAO || (melhor && confianca <= melhor.confianca)) {
      continue;
    }

    const x1 = (dados[base + 1] - letterbox.deslocX) / letterbox.escala;
    const y1 = (dados[base + 2] - letterbox.deslocY) / letterbox.escala;
    const x2 = (dados[base + 3] - letterbox.deslocX) / letterbox.escala;
    const y2 = (dados[base + 4] - letterbox.deslocY) / letterbox.escala;
    const folgaX = (x2 - x1) * FOLGA_X;
    const folgaY = (y2 - y1) * FOLGA_Y;

    const esquerda = Math.max(0, Math.round(x1 - folgaX));
    const topo = Math.max(0, Math.round(y1 - folgaY));
    const largura = Math.min(larguraOrigem - esquerda, Math.round(x2 - x1 + 2 * folgaX));
    const altura = Math.min(alturaOrigem - topo, Math.round(y2 - y1 + 2 * folgaY));
    if (largura > 0 && altura > 0) {
      melhor = { esquerda, topo, largura, altura, confianca };
    }
  }
  return melhor;
}

// A saída do leitor são probabilidades por posição (10 posições x 37 símbolos). A confiança da leitura é a
// menor probabilidade entre os caracteres de verdade (sem o preenchimento).
export function decodificarPlaca(probabilidades: ArrayLike<number>): { texto: string; confianca: number } {
  let texto = "";
  let confianca = 1;

  for (let posicao = 0; posicao < POSICOES_PLACA; posicao += 1) {
    let melhorSimbolo = 0;
    let melhorProbabilidade = -1;
    for (let simbolo = 0; simbolo < ALFABETO.length; simbolo += 1) {
      const probabilidade = probabilidades[posicao * ALFABETO.length + simbolo];
      if (probabilidade > melhorProbabilidade) {
        melhorProbabilidade = probabilidade;
        melhorSimbolo = simbolo;
      }
    }
    const caractere = ALFABETO[melhorSimbolo];
    if (caractere !== CARACTERE_VAZIO) {
      texto += caractere;
      confianca = Math.min(confianca, melhorProbabilidade);
    }
  }
  return { texto, confianca: texto ? confianca : 0 };
}

function criarCanvas(largura: number, altura: number) {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexto) {
    throw new Error("Canvas indisponível");
  }
  return { canvas, contexto };
}

// Cria o reconhecedor sob demanda: o runtime e os modelos só são baixados aqui, na primeira abertura do leitor.
export async function criarReconhecedorPlaca(): Promise<ReconhecedorPlaca> {
  const ort = await import("onnxruntime-web/wasm");
  const base = `${window.location.origin}/ocr`;
  ort.env.wasm.wasmPaths = `${base}/ort/`;
  // Sem isolamento entre origens não há threads no WASM; uma só evita o aviso e o custo de tentar.
  ort.env.wasm.numThreads = 1;

  const [detector, leitor] = await Promise.all([
    ort.InferenceSession.create(`${base}/modelos/placa-detector.onnx`, { executionProviders: ["wasm"] }),
    ort.InferenceSession.create(`${base}/modelos/placa-leitor.onnx`, { executionProviders: ["wasm"] }),
  ]);

  const entrada = criarCanvas(LADO_DETECTOR, LADO_DETECTOR);
  const recorte = criarCanvas(LARGURA_LEITOR, ALTURA_LEITOR);

  async function detectar(video: HTMLVideoElement): Promise<Caixa | null> {
    const largura = video.videoWidth;
    const altura = video.videoHeight;
    const letterbox = calcularLetterbox(largura, altura, LADO_DETECTOR);

    entrada.contexto.fillStyle = `rgb(${CINZA_BORDA}, ${CINZA_BORDA}, ${CINZA_BORDA})`;
    entrada.contexto.fillRect(0, 0, LADO_DETECTOR, LADO_DETECTOR);
    entrada.contexto.drawImage(video, letterbox.deslocX, letterbox.deslocY, letterbox.largura, letterbox.altura);

    // RGBA intercalado do canvas -> planos R, G, B normalizados (0 a 1), como o detector espera.
    const pixels = entrada.contexto.getImageData(0, 0, LADO_DETECTOR, LADO_DETECTOR).data;
    const area = LADO_DETECTOR * LADO_DETECTOR;
    const planos = new Float32Array(3 * area);
    for (let i = 0; i < area; i += 1) {
      planos[i] = pixels[i * 4] / 255;
      planos[area + i] = pixels[i * 4 + 1] / 255;
      planos[2 * area + i] = pixels[i * 4 + 2] / 255;
    }

    const saida = await detector.run({
      [detector.inputNames[0]]: new ort.Tensor("float32", planos, [1, 3, LADO_DETECTOR, LADO_DETECTOR]),
    });
    const deteccoes = saida[detector.outputNames[0]];
    return melhorDeteccao(deteccoes.data as Float32Array, deteccoes.dims[0], letterbox, largura, altura);
  }

  async function ler(video: HTMLVideoElement, caixa: Caixa): Promise<string> {
    recorte.contexto.drawImage(
      video,
      caixa.esquerda,
      caixa.topo,
      caixa.largura,
      caixa.altura,
      0,
      0,
      LARGURA_LEITOR,
      ALTURA_LEITOR,
    );

    // O leitor recebe RGB (uint8) em ordem altura x largura x canal, sem o canal alfa.
    const pixels = recorte.contexto.getImageData(0, 0, LARGURA_LEITOR, ALTURA_LEITOR).data;
    const rgb = new Uint8Array(LARGURA_LEITOR * ALTURA_LEITOR * 3);
    for (let i = 0, j = 0; i < pixels.length; i += 4, j += 3) {
      rgb[j] = pixels[i];
      rgb[j + 1] = pixels[i + 1];
      rgb[j + 2] = pixels[i + 2];
    }

    const saida = await leitor.run({
      [leitor.inputNames[0]]: new ort.Tensor("uint8", rgb, [1, ALTURA_LEITOR, LARGURA_LEITOR, 3]),
    });
    const { texto, confianca } = decodificarPlaca(saida.plate.data as Float32Array);
    return confianca >= CONFIANCA_LEITURA ? texto : "";
  }

  return {
    reconhecer: async (video) => {
      if (!video.videoWidth || !video.videoHeight) {
        return "";
      }
      const caixa = await detectar(video);
      return caixa ? ler(video, caixa) : "";
    },
    encerrar: async () => {
      await Promise.all([detector.release(), leitor.release()]);
    },
  };
}
