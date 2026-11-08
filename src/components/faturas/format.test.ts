import { describe, expect, it } from "vitest";
import { mensagemEmissao, numeroFatura, quantidadeSaidas, regraConveniada } from "./format";

describe("numeroFatura e quantidadeSaidas", () => {
  it("mostra o número com # e concorda o plural", () => {
    expect(numeroFatura({ convenioFaturaId: 12 })).toBe("#12");
    expect(quantidadeSaidas(1)).toBe("1 saída");
    expect(quantidadeSaidas(14)).toBe("14 saídas");
    expect(quantidadeSaidas(0)).toBe("0 saídas");
  });
});

describe("regraConveniada", () => {
  it("percentual", () => {
    expect(regraConveniada({ percentualConveniada: 50, valorFixoConveniada: null })).toBe("50%");
    expect(regraConveniada({ percentualConveniada: 12.5, valorFixoConveniada: null })).toBe("12,5%");
  });

  it("valor fixo", () => {
    expect(regraConveniada({ percentualConveniada: null, valorFixoConveniada: 12 })).toBe("R$ 12,00 fixo");
  });

  it("sem regra informada", () => {
    expect(regraConveniada({ percentualConveniada: null, valorFixoConveniada: null })).toBe("—");
  });
});

describe("mensagemEmissao", () => {
  it("diz quantas saídas e quanto", () => {
    expect(mensagemEmissao({ quantidadeSaidas: 14, valorTotal: 1250 })).toBe("Fatura emitida: 14 saídas, R$ 1.250,00.");
    expect(mensagemEmissao({ quantidadeSaidas: 1, valorTotal: 1.5 })).toBe("Fatura emitida: 1 saída, R$ 1,50.");
  });
});
