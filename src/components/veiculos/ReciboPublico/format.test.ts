import { describe, expect, it } from "vitest";
import { valorDoRecibo } from "./format";

describe("valorDoRecibo", () => {
  it("o valor já vem em reais: 15100 é R$ 15.100,00", () => {
    expect(valorDoRecibo(15100)).toBe(15100);
    expect(valorDoRecibo(15100.0)).toBe(15100);
    expect(valorDoRecibo(174.5)).toBe(174.5);
  });

  it("zero fica zero", () => {
    expect(valorDoRecibo(0)).toBe(0);
  });

  it("valor ausente, inválido ou negativo vira zero, sem quebrar", () => {
    expect(valorDoRecibo(undefined)).toBe(0);
    expect(valorDoRecibo(null)).toBe(0);
    expect(valorDoRecibo(Number.NaN)).toBe(0);
    expect(valorDoRecibo(-100)).toBe(0);
  });

  it("arredonda a duas casas", () => {
    expect(valorDoRecibo(12.3456)).toBe(12.35);
  });
});
