import { describe, expect, it, vi } from "vitest";
import { calcularLetterbox, decodificarPlaca, melhorDeteccao } from "./reconhecedorPlaca";

const ALFABETO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_";

// Monta a saída do leitor: uma linha de 37 probabilidades por posição, com o símbolo dado na probabilidade dada.
function saidaLeitor(texto: string, probabilidade = 1) {
  const dados = new Float32Array(10 * 37);
  for (let posicao = 0; posicao < 10; posicao += 1) {
    const simbolo = texto[posicao] ?? "_";
    dados[posicao * 37 + ALFABETO.indexOf(simbolo)] = probabilidade;
  }
  return dados;
}

describe("calcularLetterbox", () => {
  it("encaixa imagem em retrato com bordas dos lados", () => {
    expect(calcularLetterbox(1200, 1600, 512)).toEqual({ escala: 0.32, deslocX: 64, deslocY: 0, largura: 384, altura: 512 });
  });

  it("encaixa imagem em paisagem com bordas em cima e embaixo", () => {
    expect(calcularLetterbox(1280, 720, 512)).toEqual({ escala: 0.4, deslocX: 0, deslocY: 112, largura: 512, altura: 288 });
  });
});

describe("decodificarPlaca", () => {
  it("lê os caracteres e ignora o preenchimento", () => {
    expect(decodificarPlaca(saidaLeitor("QXV7G23"))).toEqual({ texto: "QXV7G23", confianca: 1 });
  });

  it("usa a menor probabilidade como confiança", () => {
    const dados = saidaLeitor("ABC1D23");
    dados[3 * 37 + ALFABETO.indexOf("1")] = 0.55;
    const { texto, confianca } = decodificarPlaca(dados);
    expect(texto).toBe("ABC1D23");
    expect(confianca).toBeCloseTo(0.55, 5);
  });

  it("devolve confiança zero quando não há caracteres", () => {
    expect(decodificarPlaca(saidaLeitor(""))).toEqual({ texto: "", confianca: 0 });
  });
});

describe("melhorDeteccao", () => {
  const letterbox = calcularLetterbox(1200, 1600, 512);
  // [lote, x1, y1, x2, y2, classe, confiança], no quadrado de 512 px.
  const linha = (x1: number, y1: number, x2: number, y2: number, confianca: number) => [0, x1, y1, x2, y2, 0, confianca];

  it("converte a caixa mais confiante para as coordenadas da imagem original", () => {
    const dados = [...linha(224, 336, 288, 356, 0.6), ...linha(200, 300, 300, 330, 0.9)];
    const caixa = melhorDeteccao(dados, 2, letterbox, 1200, 1600);
    expect(caixa?.confianca).toBe(0.9);
    // x1 = (200 - 64) / 0.32 = 425 e y1 = 300 / 0.32 = 937,5; menos a folga de 4% da largura (12,5) e 6% da altura (5,6).
    expect(caixa).toMatchObject({ esquerda: 413, topo: 932 });
    expect(caixa!.largura).toBeGreaterThan(300);
    expect(caixa!.altura).toBeGreaterThan(90);
  });

  it("ignora detecções com confiança baixa", () => {
    expect(melhorDeteccao(linha(200, 300, 300, 330, 0.2), 1, letterbox, 1200, 1600)).toBeNull();
  });

  it("não passa dos limites da imagem", () => {
    const caixa = melhorDeteccao(linha(60, 500, 460, 520, 0.9), 1, letterbox, 1200, 1600);
    expect(caixa!.esquerda).toBeGreaterThanOrEqual(0);
    expect(caixa!.esquerda + caixa!.largura).toBeLessThanOrEqual(1200);
    expect(caixa!.topo + caixa!.altura).toBeLessThanOrEqual(1600);
  });

  it("devolve null sem detecções", () => {
    expect(melhorDeteccao([], 0, letterbox, 1200, 1600)).toBeNull();
  });
});

describe("criarReconhecedorPlaca", () => {
  it("monta o runtime com arquivos locais e lê a placa detectada no vídeo", async () => {
    const run = vi.fn();
    const release = vi.fn().mockResolvedValue(undefined);
    const create = vi.fn(async (url: string) =>
      url.endsWith("placa-detector.onnx")
        ? { inputNames: ["images"], outputNames: ["output0"], run: run.mockImplementationOnce(async () => ({ output0: { data: Float32Array.from([0, 100, 200, 300, 240, 0, 0.9]), dims: [1, 7] } })), release }
        : { inputNames: ["input"], outputNames: ["plate", "region"], run: vi.fn(async () => ({ plate: { data: saidaLeitor("QXV7G23") } })), release },
    );
    class Tensor {
      constructor(public type: string, public data: unknown, public dims: number[]) {}
    }
    const env = { wasm: { wasmPaths: "", numThreads: 0 } };
    vi.doMock("onnxruntime-web/wasm", () => ({ env, InferenceSession: { create }, Tensor }));

    const contexto = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: (_x: number, _y: number, largura: number, altura: number) => ({ data: new Uint8ClampedArray(largura * altura * 4) }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(contexto as unknown as CanvasRenderingContext2D);

    const { criarReconhecedorPlaca } = await import("./reconhecedorPlaca");
    const reconhecedor = await criarReconhecedorPlaca();

    expect(env.wasm.wasmPaths).toBe(`${window.location.origin}/ocr/ort/`);
    expect(env.wasm.numThreads).toBe(1);
    expect(create.mock.calls.map(([url]) => url)).toEqual([
      `${window.location.origin}/ocr/modelos/placa-detector.onnx`,
      `${window.location.origin}/ocr/modelos/placa-leitor.onnx`,
    ]);

    const video = document.createElement("video");
    Object.defineProperty(video, "videoWidth", { value: 1280 });
    Object.defineProperty(video, "videoHeight", { value: 720 });
    expect(await reconhecedor.reconhecer(video)).toBe("QXV7G23");

    await reconhecedor.encerrar();
    expect(release).toHaveBeenCalledTimes(2);

    vi.doUnmock("onnxruntime-web/wasm");
    vi.restoreAllMocks();
  });

  it("devolve vazio sem quadro de vídeo disponível", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as unknown as CanvasRenderingContext2D);
    vi.doMock("onnxruntime-web/wasm", () => ({
      env: { wasm: {} },
      InferenceSession: { create: async () => ({ inputNames: ["x"], outputNames: ["y"], release: async () => {} }) },
      Tensor: class {},
    }));
    const { criarReconhecedorPlaca } = await import("./reconhecedorPlaca");
    const reconhecedor = await criarReconhecedorPlaca();
    expect(await reconhecedor.reconhecer(document.createElement("video"))).toBe("");
    vi.doUnmock("onnxruntime-web/wasm");
    vi.restoreAllMocks();
  });
});
