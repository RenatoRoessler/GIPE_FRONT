import { describe, expect, it } from "vitest";
import { maskMoney, parseMaskedMoney, parseMoney } from "./money";

describe("maskMoney", () => {
  it.each([
    ["", ""],
    ["abc", ""],
    ["5", "R$ 5"],
    ["50", "R$ 50"],
    ["1234", "R$ 1.234"],
    ["1234567", "R$ 1.234.567"],
    ["12,5", "R$ 12,5"],
    ["12,567", "R$ 12,56"],
    ["1.234,56", "R$ 1.234,56"],
    [",", "R$ 0,"],
    [",5", "R$ 0,5"],
    ["007", "R$ 7"],
    ["1,2,3", "R$ 1,23"],
    ["R$ ", ""],
    ["R$ 20", "R$ 20"],
  ])("%j -> %j", (entrada, esperado) => {
    expect(maskMoney(entrada)).toBe(esperado);
  });

  it("gera texto aceito por parseMoney", () => {
    expect(parseMoney(maskMoney("1234,5"))).toBe(1234.5);
    expect(parseMoney(maskMoney("20"))).toBe(20);
  });
});

describe("parseMaskedMoney", () => {
  it.each([
    ["R$ 1.250", 1250],
    ["1.250", 1250],
    ["R$ 12.500", 12500],
    ["R$ 1.234.567", 1234567],
  ])("%s vale %d, como a máscara mostra", (texto, esperado) => {
    expect(parseMaskedMoney(texto)).toBe(esperado);
  });

  it("o que a máscara gera ao digitar só dígitos volta ao mesmo valor", () => {
    for (const digitos of ["5", "50", "1250", "9999", "10000", "123456"]) {
      expect(parseMaskedMoney(maskMoney(digitos))).toBe(Number(digitos));
    }
  });

  it("com vírgula ou sem ponto de milhar, lê como parseMoney", () => {
    expect(parseMaskedMoney("R$ 1.234,56")).toBe(1234.56);
    expect(parseMaskedMoney("R$ 1.250,5")).toBe(1250.5);
    expect(parseMaskedMoney("15.50")).toBe(15.5);
    expect(parseMaskedMoney("0.125")).toBe(0.125);
  });

  it("vazio e inválido devolvem NaN", () => {
    expect(parseMaskedMoney("")).toBeNaN();
    expect(parseMaskedMoney("abc")).toBeNaN();
  });
});
