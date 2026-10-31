import { describe, expect, it } from "vitest";
import { aceitaCaractere, limparTexto, maxPadrao, normalizarCaractere } from "./regras";

describe("maxPadrao", () => {
  it("devolve o limite de cada teclado", () => {
    expect(maxPadrao({ tipo: "placa" })).toBe(7);
    expect(maxPadrao({ tipo: "numerico", modo: "inteiro" })).toBe(20);
    expect(maxPadrao({ tipo: "alfa" })).toBe(40);
  });
});

describe("normalizarCaractere", () => {
  it("passa para maiúscula sem acento em placa e alfa", () => {
    expect(normalizarCaractere({ tipo: "alfa" }, "a")).toBe("A");
    expect(normalizarCaractere({ tipo: "alfa" }, "ç")).toBe("C");
    expect(normalizarCaractere({ tipo: "placa" }, "b")).toBe("B");
  });

  it("não mexe no numérico", () => {
    expect(normalizarCaractere({ tipo: "numerico", modo: "livre" }, ",")).toBe(",");
  });
});

describe("aceitaCaractere", () => {
  it("placa segue a posição", () => {
    expect(aceitaCaractere({ tipo: "placa" }, "AB", "C", 7)).toBe(true);
    expect(aceitaCaractere({ tipo: "placa" }, "AB", "1", 7)).toBe(false);
    expect(aceitaCaractere({ tipo: "placa" }, "ABC1D23", "4", 7)).toBe(false);
  });

  it("numérico e alfa usam as regras próprias", () => {
    expect(aceitaCaractere({ tipo: "numerico", modo: "inteiro" }, "1", ",", 20)).toBe(false);
    expect(aceitaCaractere({ tipo: "alfa" }, "GOL", " ", 40)).toBe(true);
  });
});

describe("limparTexto", () => {
  it("limpa o texto colado conforme o tipo", () => {
    expect(limparTexto({ tipo: "placa" }, "abc-1d23", 7)).toBe("ABC1D23");
    expect(limparTexto({ tipo: "placa" }, "1ABC123", 7)).toBe("ABC123");
    expect(limparTexto({ tipo: "numerico", modo: "decimal" }, "R$ 1.234,567", 20)).toBe("1234,56");
    expect(limparTexto({ tipo: "alfa" }, "são joão", 40)).toBe("SAO JOAO");
  });
});
