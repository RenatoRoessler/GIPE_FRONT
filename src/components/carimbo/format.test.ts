import { describe, expect, it } from "vitest";
import { categoriaDoCarimbo, corDoCarimbo, formatDateTime, textoOuTraco } from "./format";

describe("categoriaDoCarimbo", () => {
  it("devolve o nome da categoria", () => {
    expect(categoriaDoCarimbo(1)).toBe("Moto");
    expect(categoriaDoCarimbo(2)).toBe("Carro pequeno");
  });

  it("sem categoria vira traço", () => {
    expect(categoriaDoCarimbo(0)).toBe("—");
  });
});

describe("corDoCarimbo", () => {
  it("usa o rótulo da cor conhecida", () => {
    expect(corDoCarimbo("PRATA")).toBe("Prata");
  });

  it("cor fora da lista aparece como veio, e vazia vira traço", () => {
    expect(corDoCarimbo("VERDE-MUSGO")).toBe("VERDE-MUSGO");
    expect(corDoCarimbo("")).toBe("—");
  });
});

describe("textoOuTraco", () => {
  it("troca vazio por traço", () => {
    expect(textoOuTraco("")).toBe("—");
    expect(textoOuTraco("teste 2")).toBe("teste 2");
  });
});

describe("formatDateTime", () => {
  it("data e hora locais, e traço sem data", () => {
    expect(formatDateTime("2026-10-29T18:15:51.1460216")).toMatch(/29\/10\/(20)?26.*18:15/);
    expect(formatDateTime("")).toBe("—");
  });
});
