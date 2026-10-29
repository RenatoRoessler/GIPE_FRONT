import { describe, expect, it } from "vitest";
import type { Caixa } from "@/types/caixa";
import type { TotalForma } from "./agregados";
import { formasDoResumo, totalDeTickets, valorEmCaixa } from "./resumo";

function caixa(extra: Partial<Caixa> = {}): Caixa {
  return {
    caixaId: 1,
    dataHoraAbertura: "2026-10-23T08:00:00",
    valorFundoCaixa: 100,
    valorTotalEntrada: 250,
    valorTotalSaida: 0,
    ...extra,
  };
}

function total(formaPagamento: number, entradas: number, quantidade: number): TotalForma {
  return { formaPagamento, entradas, saidas: 0, quantidade };
}

describe("valorEmCaixa", () => {
  it("sem saídas é o recebido mais o fundo", () => {
    expect(valorEmCaixa(caixa())).toBe(350);
  });

  it("usa o saldo atual da API quando ele existe e as saídas reduzem o valor", () => {
    expect(valorEmCaixa(caixa({ valorTotalSaida: 50, saldoAtual: 200 }))).toBe(300);
  });

  it("sem saldo calcula entradas menos saídas", () => {
    expect(valorEmCaixa(caixa({ valorTotalSaida: 50 }))).toBe(300);
  });

  it("dado ausente ou inválido nunca vira NaN", () => {
    const valor = valorEmCaixa(caixa({ valorTotalEntrada: null, valorTotalSaida: null, saldoAtual: Number.NaN }));
    expect(valor).toBe(100);
  });
});

describe("totalDeTickets", () => {
  it("soma a quantidade de todas as formas", () => {
    expect(totalDeTickets([total(1, 10, 2), total(2, 30, 3)])).toBe(5);
    expect(totalDeTickets([])).toBe(0);
  });
});

describe("formasDoResumo", () => {
  it("mostra sempre as quatro formas, na ordem Dinheiro, Pix, Débito, Crédito", () => {
    const formas = formasDoResumo([total(4, 40, 1), total(1, 60, 2)]);
    expect(formas.map((forma) => forma.rotulo)).toEqual(["Dinheiro", "Pix", "Cartão de débito", "Cartão de crédito"]);
    expect(formas.map((forma) => forma.cor)).toEqual(["dinheiro", "pix", "debito", "credito"]);
    expect(formas[0]).toMatchObject({ valor: 60, quantidade: 2, percentual: 60 });
    expect(formas[1]).toMatchObject({ valor: 0, quantidade: 0, percentual: 0 });
    expect(formas[3]).toMatchObject({ valor: 40, quantidade: 1, percentual: 40 });
  });

  it("formas extras só aparecem com entrada, na cor steel", () => {
    const formas = formasDoResumo([total(5, 50, 1), total(6, 0, 0)]);
    expect(formas).toHaveLength(5);
    expect(formas[4]).toMatchObject({ formaPagamento: 5, rotulo: "Boleto", cor: "steel", percentual: 100 });
  });

  it("tudo zerado não gera NaN", () => {
    const formas = formasDoResumo([]);
    expect(formas).toHaveLength(4);
    expect(formas.every((forma) => forma.valor === 0 && forma.percentual === 0)).toBe(true);
  });
});
