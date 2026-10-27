import { afterEach, describe, expect, it, vi } from "vitest";
import type { Movimento } from "@/types/caixa";
import { baixarCsv, movimentosParaCsv } from "./exportCsv";

function mov(extra: Partial<Movimento> = {}): Movimento {
  return {
    movimentoId: 1,
    dataHora: "2026-10-23T09:05:00",
    tipo: "entrada",
    valor: 1234.5,
    formaPagamento: 2,
    turnoId: 7,
    usuario: "Ana",
    motivo: null,
    ...extra,
  };
}

describe("movimentosParaCsv", () => {
  it("começa com BOM, tem cabeçalho em português e separador ;", () => {
    const csv = movimentosParaCsv([]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toBe("\uFEFFData/hora;Tipo;Forma de pagamento;Turno;Usuário;Motivo;Valor\r\n");
  });

  it("escreve entrada com vírgula decimal e sem milhar", () => {
    const [, linha] = movimentosParaCsv([mov()]).split("\r\n");
    expect(linha).toBe("23/10/2026 09:05;Entrada;Pix;7;Ana;;1234,50");
  });

  it("saída e sangria saem negativas", () => {
    const linhas = movimentosParaCsv([
      mov({ tipo: "saida", valor: 10 }),
      mov({ tipo: "sangria", valor: 80, formaPagamento: 1, motivo: "Cofre" }),
    ]).split("\r\n");
    expect(linhas[1]).toContain(";Saída;");
    expect(linhas[1].endsWith(";-10,00")).toBe(true);
    expect(linhas[2]).toContain(";Sangria;Dinheiro;");
    expect(linhas[2].endsWith(";Cofre;-80,00")).toBe(true);
  });

  it("escapa ponto e vírgula, aspas e quebras de linha", () => {
    const csv = movimentosParaCsv([mov({ motivo: 'Troco; "urgente"\nlinha 2', usuario: "A;B" })]);
    expect(csv).toContain('"A;B"');
    expect(csv).toContain('"Troco; ""urgente""\nlinha 2"');
  });

  it("campos ausentes ficam vazios", () => {
    const [, linha] = movimentosParaCsv([mov({ formaPagamento: null, turnoId: null, dataHora: "" })]).split("\r\n");
    expect(linha).toBe(";Entrada;;;Ana;;1234,50");
  });
});

describe("baixarCsv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cria o arquivo com a extensão .csv e libera a URL", () => {
    const criar = vi.fn(() => "blob:teste");
    const revogar = vi.fn();
    Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar });
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    let nome = "";
    const original = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const elemento = original(tag);
      if (tag === "a") {
        Object.defineProperty(elemento, "download", { set: (valor: string) => (nome = valor), get: () => nome });
      }
      return elemento;
    });

    baixarCsv("extrato-caixa-12", "a;b");

    expect(nome).toBe("extrato-caixa-12.csv");
    expect(clique).toHaveBeenCalledTimes(1);
    expect(criar).toHaveBeenCalledTimes(1);
    expect(revogar).toHaveBeenCalledWith("blob:teste");
  });

  it("não duplica a extensão", () => {
    Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => undefined });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    let nome = "";
    const original = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const elemento = original(tag);
      if (tag === "a") {
        Object.defineProperty(elemento, "download", { set: (valor: string) => (nome = valor), get: () => nome });
      }
      return elemento;
    });

    baixarCsv("extrato.csv", "x");

    expect(nome).toBe("extrato.csv");
  });
});

describe("movimentosParaCsv: injeção de fórmula", () => {
  it("prefixa com apóstrofo textos livres que começam como fórmula, sem mexer no valor negativo", () => {
    const csv = movimentosParaCsv([
      mov({ tipo: "saida", valor: 10, usuario: "=SOMA(A1)", motivo: "@SOMA(A1)" }),
    ]);
    expect(csv).toContain("'=SOMA(A1)");
    expect(csv).toContain("'@SOMA(A1)");
    expect(csv).toContain(";-10,00");
  });
});
