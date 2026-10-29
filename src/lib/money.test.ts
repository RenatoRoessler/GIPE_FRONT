import { describe, expect, it } from "vitest";
import { maskMoney, parseMoney } from "./money";

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
