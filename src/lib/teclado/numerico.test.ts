import { describe, expect, it } from "vitest";
import { aceitaNumerico, limparNumerico } from "./numerico";

describe("aceitaNumerico", () => {
  it("inteiro aceita só dígitos", () => {
    expect(aceitaNumerico("inteiro", "12", "3", 20)).toBe(true);
    expect(aceitaNumerico("inteiro", "12", ",", 20)).toBe(false);
    expect(aceitaNumerico("inteiro", "12", ".", 20)).toBe(false);
    expect(aceitaNumerico("inteiro", "12", "-", 20)).toBe(false);
    expect(aceitaNumerico("inteiro", "12", "a", 20)).toBe(false);
  });

  it("decimal aceita uma vírgula, nunca como primeiro caractere", () => {
    expect(aceitaNumerico("decimal", "", ",", 20)).toBe(false);
    expect(aceitaNumerico("decimal", "1", ",", 20)).toBe(true);
    expect(aceitaNumerico("decimal", "1,5", ",", 20)).toBe(false);
    expect(aceitaNumerico("decimal", "1", ".", 20)).toBe(false);
  });

  it("decimal aceita no máximo 2 casas", () => {
    expect(aceitaNumerico("decimal", "1,5", "0", 20)).toBe(true);
    expect(aceitaNumerico("decimal", "1,50", "0", 20)).toBe(false);
    expect(aceitaNumerico("decimal", "100", "0", 20)).toBe(true);
  });

  it("decimal ignora a máscara de moeda ao contar", () => {
    expect(aceitaNumerico("decimal", "R$ 1.234", ",", 20)).toBe(true);
    expect(aceitaNumerico("decimal", "R$ 1.234,56", "7", 20)).toBe(false);
  });

  it("livre aceita dígitos, vírgula, ponto e hífen", () => {
    for (const ch of ["1", ",", ".", "-"]) {
      expect(aceitaNumerico("livre", "1", ch, 20)).toBe(true);
    }
    expect(aceitaNumerico("livre", "1", "a", 20)).toBe(false);
  });

  it("respeita o limite", () => {
    expect(aceitaNumerico("inteiro", "123", "4", 3)).toBe(false);
    expect(aceitaNumerico("inteiro", "12", "3", 3)).toBe(true);
  });
});

describe("limparNumerico", () => {
  it("descarta o que não cabe, na ordem", () => {
    expect(limparNumerico("inteiro", "1a2,3", 20)).toBe("123");
    expect(limparNumerico("decimal", ",12,345", 20)).toBe("12,34");
    expect(limparNumerico("livre", "1-2.3 x", 20)).toBe("1-2.3");
  });

  it("corta no limite", () => {
    expect(limparNumerico("inteiro", "123456", 4)).toBe("1234");
  });

  it("devolve vazio sem nada aproveitável", () => {
    expect(limparNumerico("inteiro", "abc", 20)).toBe("");
  });
});
