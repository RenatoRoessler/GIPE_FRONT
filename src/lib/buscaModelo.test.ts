import { describe, expect, it } from "vitest";
import { destacarTrecho, filtrarModelos, normalizarBusca, prepararModelos } from "./buscaModelo";

const modelos = prepararModelos([
  { modeloId: 1, nome: "Civic", categoria: 1 },
  { modeloId: 2, nome: "Corolla Cross", categoria: 1 },
  { modeloId: 3, nome: "Fiat Uno", categoria: 1 },
  { modeloId: 4, nome: "Cíclone", categoria: 2 },
  { modeloId: 5, nome: "Gol", categoria: 1 },
]);

describe("normalizarBusca", () => {
  it("ignora acento, caixa e espaços nas pontas", () => {
    expect(normalizarBusca("  CÍclone ")).toBe("ciclone");
  });
});

describe("filtrarModelos", () => {
  it("devolve vazio sem texto", () => {
    expect(filtrarModelos(modelos, "  ")).toEqual([]);
  });

  it("filtra desde o primeiro caractere, sem acento e sem diferenciar caixa", () => {
    expect(filtrarModelos(modelos, "c").map((m) => m.nome)).toEqual(["Civic", "Corolla Cross", "Cíclone"]);
    expect(filtrarModelos(modelos, "CICL").map((m) => m.nome)).toEqual(["Cíclone"]);
  });

  it("põe quem começa com o texto antes de quem apenas contém", () => {
    const lista = prepararModelos([
      { modeloId: 1, nome: "Fiat Uno", categoria: 1 },
      { modeloId: 2, nome: "Uno Mille", categoria: 1 },
      { modeloId: 3, nome: "Gol", categoria: 1 },
    ]);
    expect(filtrarModelos(lista, "uno").map((m) => m.nome)).toEqual(["Uno Mille", "Fiat Uno"]);
  });

  it("respeita o limite", () => {
    expect(filtrarModelos(modelos, "c", 2)).toHaveLength(2);
  });
});

describe("destacarTrecho", () => {
  it("separa o trecho digitado", () => {
    expect(destacarTrecho("Corolla Cross", "olla")).toEqual({ antes: "Cor", casado: "olla", depois: " Cross" });
  });

  it("casa sem acento preservando o texto original", () => {
    expect(destacarTrecho("Cíclone", "cic")).toEqual({ antes: "", casado: "Cíc", depois: "lone" });
  });

  it("não destaca quando não há casamento", () => {
    expect(destacarTrecho("Gol", "xyz")).toEqual({ antes: "Gol", casado: "", depois: "" });
  });
});
