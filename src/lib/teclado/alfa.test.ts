import { describe, expect, it } from "vitest";
import { aceitaAlfa, aparar, limparAlfa } from "./alfa";

describe("aceitaAlfa", () => {
  it("aceita letras maiúsculas, dígitos, ponto, vírgula e hífen", () => {
    for (const ch of ["A", "Z", "0", "9", ".", ",", "-"]) {
      expect(aceitaAlfa("AB", ch, 40)).toBe(true);
    }
    expect(aceitaAlfa("AB", "a", 40)).toBe(false);
    expect(aceitaAlfa("AB", "é", 40)).toBe(false);
  });

  it("não aceita espaço no início nem duplo", () => {
    expect(aceitaAlfa("", " ", 40)).toBe(false);
    expect(aceitaAlfa("AB ", " ", 40)).toBe(false);
    expect(aceitaAlfa("AB", " ", 40)).toBe(true);
  });

  it("respeita o limite", () => {
    expect(aceitaAlfa("ABC", "D", 3)).toBe(false);
  });
});

describe("limparAlfa", () => {
  it("passa para caixa alta e remove acento", () => {
    expect(limparAlfa("Fiesta São João", 40)).toBe("FIESTA SAO JOAO");
    expect(limparAlfa("corolla", 40)).toBe("COROLLA");
  });

  it("remove espaço inicial e duplo", () => {
    expect(limparAlfa("  gol   bola", 40)).toBe("GOL BOLA");
  });

  it("descarta símbolos e corta no limite", () => {
    expect(limparAlfa("a@b#c", 40)).toBe("ABC");
    expect(limparAlfa("abcdef", 4)).toBe("ABCD");
  });
});

describe("aparar", () => {
  it("remove espaço sobrando no fim", () => {
    expect(aparar("GOL ")).toBe("GOL");
    expect(aparar("GOL BOLA")).toBe("GOL BOLA");
  });
});
