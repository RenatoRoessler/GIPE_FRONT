import { describe, expect, it } from "vitest";
import { TIPO_LANCAMENTO } from "@/types/financeiro";
import {
  formatDataBr,
  formatDiaMes,
  formatPercentual,
  formatSaldo,
  formatValorComSinal,
  nomeDaCategoria,
  periodoPorExtenso,
  rotuloDiaCompleto,
  rotuloMes,
  rotuloMesExtenso,
  rotuloTipo,
} from "./format";

// O Intl usa espaço inseparável entre "R$" e o número.
const limpo = (texto: string) => texto.replace(/ /g, " ");

describe("formatValorComSinal", () => {
  it("entrada leva +, saída leva −, e o valor é sempre lido sem sinal", () => {
    expect(limpo(formatValorComSinal(100, TIPO_LANCAMENTO.Entrada))).toBe("+ R$ 100,00");
    expect(limpo(formatValorComSinal(450, TIPO_LANCAMENTO.Saida))).toBe("− R$ 450,00");
    expect(limpo(formatValorComSinal(-450, TIPO_LANCAMENTO.Saida))).toBe("− R$ 450,00");
  });

  it("sem tipo, mostra o valor sem sinal", () => {
    expect(limpo(formatValorComSinal(1234.5, null))).toBe("R$ 1.234,50");
  });
});

describe("formatSaldo", () => {
  it("negativo leva o sinal − escrito; zero e positivo não", () => {
    expect(limpo(formatSaldo(-1250))).toBe("− R$ 1.250,00");
    expect(limpo(formatSaldo(75110))).toBe("R$ 75.110,00");
    expect(limpo(formatSaldo(0))).toBe("R$ 0,00");
  });
});

describe("nomeDaCategoria", () => {
  it("junta pai e filha, e deixa a principal só com o nome", () => {
    expect(nomeDaCategoria("Energia", "Despesas fixas")).toBe("Despesas fixas › Energia");
    expect(nomeDaCategoria("Aluguel", null)).toBe("Aluguel");
  });
});

describe("rotuloTipo", () => {
  it("nomeia os dois tipos", () => {
    expect(rotuloTipo(TIPO_LANCAMENTO.Entrada)).toBe("Entrada");
    expect(rotuloTipo(TIPO_LANCAMENTO.Saida)).toBe("Saída");
  });
});

describe("datas", () => {
  it("formata sem deslocar o dia por causa do fuso", () => {
    expect(formatDataBr("2026-10-01")).toBe("01/10/2026");
    expect(formatDataBr("2026-10-22T00:00:00")).toBe("22/10/2026");
    expect(formatDiaMes("2026-01-05")).toBe("05/01");
  });

  it("data inválida vira traço", () => {
    expect(formatDataBr("")).toBe("—");
    expect(formatDiaMes("ontem")).toBe("—");
    expect(rotuloMes("")).toBe("—");
    expect(rotuloDiaCompleto("x")).toBe("—");
    expect(rotuloMesExtenso("x")).toBe("—");
  });

  it("rotula o mês, curto e por extenso", () => {
    expect(rotuloMes("2026-10-01")).toBe("out/26");
    expect(rotuloMes("2027-01-01")).toBe("jan/27");
    expect(rotuloMesExtenso("2026-03-01")).toBe("Março de 2026");
  });

  it("dá o dia da semana certo", () => {
    expect(rotuloDiaCompleto("2026-10-22")).toBe("Qui, 22/10/2026");
    expect(rotuloDiaCompleto("2026-10-25")).toBe("Dom, 25/10/2026");
    expect(rotuloDiaCompleto("2026-10-31")).toBe("Sáb, 31/10/2026");
  });
});

describe("periodoPorExtenso", () => {
  it("no mesmo ano, o ano aparece uma vez só", () => {
    expect(periodoPorExtenso("2026-10-01", "2026-10-31")).toBe("01/10 a 31/10/2026");
  });

  it("entre anos, aparecem os dois", () => {
    expect(periodoPorExtenso("2025-12-01", "2026-01-31")).toBe("01/12/2025 a 31/01/2026");
  });

  it("período inválido não mostra nada", () => {
    expect(periodoPorExtenso("", "2026-10-31")).toBe("");
  });
});

describe("formatPercentual", () => {
  it("usa uma casa decimal e vírgula, sem casa quando é inteiro", () => {
    expect(formatPercentual(99.6)).toBe("99,6%");
    expect(formatPercentual(25)).toBe("25%");
    expect(formatPercentual(0.4)).toBe("0,4%");
    expect(formatPercentual(100)).toBe("100%");
  });

  it("fatia diferente de zero mas minúscula não vira 0,0%", () => {
    expect(formatPercentual(0.04)).toBe("<0,1%");
  });

  it("zero, negativo e inválido valem 0%", () => {
    expect(formatPercentual(0)).toBe("0%");
    expect(formatPercentual(-3)).toBe("0%");
    expect(formatPercentual(Number.NaN)).toBe("0%");
  });
});
