import { describe, expect, it } from "vitest";
import {
  calcularTroco,
  CHAVE_DA_FORMA,
  filtrarFormasAceitas,
  FORMA_DINHEIRO,
  FORMA_PADRAO,
  FORMAS_SAIDA,
  getPagamentoStatus,
  valoresIguais,
} from "./saida";

describe("FORMAS_SAIDA", () => {
  it("oferece Dinheiro, Crédito, Débito e Pix, com Dinheiro como padrão", () => {
    expect(FORMAS_SAIDA.map((forma) => forma.label)).toEqual(["Dinheiro", "Crédito", "Débito", "Pix"]);
    expect(FORMA_PADRAO).toBe(FORMA_DINHEIRO);
  });
});

describe("getPagamentoStatus", () => {
  it("exige a forma de pagamento", () => {
    expect(getPagamentoStatus("", "", 10).canConfirm).toBe(false);
  });

  it("não pede valor recebido fora de Dinheiro", () => {
    const pix = FORMAS_SAIDA.find((forma) => forma.label === "Pix")!.value;
    expect(getPagamentoStatus(pix, "", 10)).toEqual({ canConfirm: true, motivo: undefined });
  });

  it("em Dinheiro, pede o valor recebido quando vazio ou inválido", () => {
    expect(getPagamentoStatus(FORMA_DINHEIRO, "", 10)).toMatchObject({ canConfirm: false, motivo: "Informe o valor recebido." });
    expect(getPagamentoStatus(FORMA_DINHEIRO, "abc", 10).canConfirm).toBe(false);
  });

  it("em Dinheiro, barra valor menor e informa quanto falta", () => {
    const status = getPagamentoStatus(FORMA_DINHEIRO, "7,50", 10);
    expect(status.canConfirm).toBe(false);
    expect(status.motivo).toMatch(/^Faltam R\$\s2,50\.$/);
  });

  it("em Dinheiro, aceita valor igual ou maior", () => {
    expect(getPagamentoStatus(FORMA_DINHEIRO, "10,00", 10).canConfirm).toBe(true);
    expect(getPagamentoStatus(FORMA_DINHEIRO, "20", 10).canConfirm).toBe(true);
  });
});

describe("valores em centavos", () => {
  it("compara sem erro de ponto flutuante", () => {
    expect(valoresIguais(0.1 + 0.2, 0.3)).toBe(true);
    expect(calcularTroco(20, 12.5)).toBe(7.5);
    expect(calcularTroco(5, 12.5)).toBe(0);
  });
});

describe("formas aceitas pela empresa", () => {
  it("cada forma da saída tem uma chave na configuração", () => {
    expect(FORMAS_SAIDA.map((forma) => CHAVE_DA_FORMA[forma.value])).toEqual([
      "dinheiro",
      "cartaoCredito",
      "cartaoDebito",
      "pix",
    ]);
  });

  it("mantém só as formas ligadas, na ordem da saída", () => {
    const aceitas = filtrarFormasAceitas({ dinheiro: false, pix: true, cartaoCredito: true, cartaoDebito: false });
    expect(aceitas.map((forma) => forma.label)).toEqual(["Crédito", "Pix"]);
  });

  it("devolve lista vazia quando tudo está desligado", () => {
    expect(filtrarFormasAceitas({ dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false })).toEqual([]);
  });
});
