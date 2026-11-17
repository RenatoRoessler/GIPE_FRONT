import { describe, expect, it } from "vitest";
import { formaPagamentoLabel } from "./format";

describe("formaPagamentoLabel", () => {
  it("devolve o nome de uma forma conhecida", () => {
    expect(formaPagamentoLabel(1)).toBe("Dinheiro");
  });

  it("não monta 'Forma null' quando a forma vem vazia", () => {
    expect(formaPagamentoLabel(null)).toBe("—");
    expect(formaPagamentoLabel(undefined)).toBe("—");
  });

  it("mantém o rótulo genérico para um id desconhecido", () => {
    expect(formaPagamentoLabel(999)).toBe("Forma 999");
  });
});
