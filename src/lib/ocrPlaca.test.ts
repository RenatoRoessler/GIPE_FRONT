import { describe, expect, it, vi } from "vitest";
import { criarConsenso, extrairPlaca } from "./ocrPlaca";

describe("extrairPlaca", () => {
  it("reconhece placa Mercosul e antiga", () => {
    expect(extrairPlaca("ABC1D23")).toBe("ABC1D23");
    expect(extrairPlaca("ABC1234")).toBe("ABC1234");
  });

  it("ignora hífen, espaços, minúsculas e ruído ao redor", () => {
    expect(extrairPlaca("  abc-1234 \n")).toBe("ABC1234");
    expect(extrairPlaca("BRASIL ABC 1D23 ??")).toBe("ABC1D23");
  });

  it("corrige confusões nas posições de letra e de dígito", () => {
    expect(extrairPlaca("8RA1234")).toBe("BRA1234");
    expect(extrairPlaca("ABCI234")).toBe("ABC1234");
    expect(extrairPlaca("ABC1D2S")).toBe("ABC1D25");
    expect(extrairPlaca("A0C1B23")).toBe("AOC1B23");
    expect(extrairPlaca("ABC1O23")).toBe("ABC1O23");
  });

  it("aceita letra ou dígito na 5ª posição", () => {
    expect(extrairPlaca("ABC1B23")).toBe("ABC1B23");
    expect(extrairPlaca("ABC1523")).toBe("ABC1523");
  });

  it("devolve null quando não há placa válida", () => {
    expect(extrairPlaca("")).toBeNull();
    expect(extrairPlaca("BRASIL")).toBeNull();
    expect(extrairPlaca("ABC12")).toBeNull();
    expect(extrairPlaca("1234567")).toBeNull();
  });
});

describe("criarConsenso", () => {
  it("só confirma depois de duas leituras iguais seguidas", () => {
    const consenso = criarConsenso();
    expect(consenso.registrar("ABC1D23")).toBeNull();
    expect(consenso.registrar("ABC1D23")).toBe("ABC1D23");
  });

  it("zera a contagem quando a leitura muda ou falha", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D23");
    expect(consenso.registrar("ABC1D24")).toBeNull();
    expect(consenso.registrar(null)).toBeNull();
    expect(consenso.registrar("ABC1D24")).toBeNull();
    expect(consenso.registrar("ABC1D24")).toBe("ABC1D24");
  });

  it("reiniciar descarta o que foi lido", () => {
    const consenso = criarConsenso();
    consenso.registrar("ABC1D23");
    consenso.reiniciar();
    expect(consenso.registrar("ABC1D23")).toBeNull();
  });
});

describe("criarReconhecedorPlaca", () => {
  it("cria o worker com arquivos locais, só letras e números e linha única", async () => {
    const recognize = vi.fn().mockResolvedValue({ data: { text: "ABC1D23\n" } });
    const setParameters = vi.fn().mockResolvedValue(undefined);
    const terminate = vi.fn().mockResolvedValue(undefined);
    const createWorker = vi.fn().mockResolvedValue({ recognize, setParameters, terminate });
    vi.doMock("tesseract.js", () => ({
      default: { createWorker, OEM: { LSTM_ONLY: 1 }, PSM: { SINGLE_LINE: "7" } },
    }));

    const { criarReconhecedorPlaca } = await import("./ocrPlaca");
    const reconhecedor = await criarReconhecedorPlaca();

    const [idioma, motor, caminhos] = createWorker.mock.calls[0];
    expect(idioma).toBe("eng");
    expect(motor).toBe(1);
    expect(caminhos).toEqual({
      workerPath: `${window.location.origin}/ocr/worker.min.js`,
      corePath: `${window.location.origin}/ocr/core`,
      langPath: `${window.location.origin}/ocr/lang`,
    });
    expect(setParameters).toHaveBeenCalledWith({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      tessedit_pageseg_mode: "7",
    });

    const canvas = document.createElement("canvas");
    expect(await reconhecedor.reconhecer(canvas)).toBe("ABC1D23\n");
    expect(recognize).toHaveBeenCalledWith(canvas);

    await reconhecedor.encerrar();
    expect(terminate).toHaveBeenCalledTimes(1);
    vi.doUnmock("tesseract.js");
  });
});
