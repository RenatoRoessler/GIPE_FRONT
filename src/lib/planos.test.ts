import { describe, expect, it } from "vitest";
import {
  descreverCondicao,
  descricaoDoTeste,
  ehTesteGratisNaUrl,
  FIM_DO_LANCAMENTO,
  formatarReais,
  lancamentoVigente,
  lerPlanoDaUrl,
  PLANO_MENSAL,
  PLANOS,
  valorPorMes,
} from "./planos";

const ANTES = new Date("2027-06-30T23:59:59-03:00").getTime();
const DEPOIS = FIM_DO_LANCAMENTO.getTime();

describe("PLANOS", () => {
  it("tem só o plano Mensal, com tabela, lançamento e 12 meses", () => {
    expect(PLANOS).toEqual([PLANO_MENSAL]);
    expect(PLANO_MENSAL).toMatchObject({
      tipo: 1,
      nome: "Mensal",
      centavosPorMes: 9990,
      centavosLancamento: 6990,
      mesesDeLancamento: 12,
    });
  });
});

describe("lancamentoVigente", () => {
  it("vale até 30/06/2027 23:59 em Brasília e acaba em 01/07/2027 00:00", () => {
    expect(lancamentoVigente(ANTES)).toBe(true);
    expect(lancamentoVigente(DEPOIS - 1)).toBe(true);
    expect(lancamentoVigente(DEPOIS)).toBe(false);
    expect(lancamentoVigente(DEPOIS + 1)).toBe(false);
  });

  it("o fim é 1º/07/2027 00:00 -03:00", () => {
    expect(FIM_DO_LANCAMENTO.toISOString()).toBe("2027-07-01T03:00:00.000Z");
  });
});

describe("formatarReais", () => {
  it("formata em reais com espaço comum", () => {
    expect(formatarReais(6990)).toBe("R$ 69,90");
    expect(formatarReais(9990)).toBe("R$ 99,90");
  });
});

describe("valorPorMes", () => {
  it("usa o valor de lançamento enquanto vigente e o de tabela depois", () => {
    expect(valorPorMes(PLANO_MENSAL, ANTES)).toBe(6990);
    expect(valorPorMes(PLANO_MENSAL, DEPOIS)).toBe(9990);
  });
});

describe("descreverCondicao", () => {
  it("explica a regra dos 12 meses no lançamento e cobra mensal depois", () => {
    expect(descreverCondicao(PLANO_MENSAL, ANTES)).toBe("R$ 69,90/mês nos primeiros 12 meses; depois, R$ 99,90/mês.");
    expect(descreverCondicao(PLANO_MENSAL, DEPOIS)).toBe("Cobrado todo mês");
  });
});

describe("ehTesteGratisNaUrl", () => {
  it("aceita só o texto exato 0", () => {
    expect(ehTesteGratisNaUrl("0")).toBe(true);
  });

  it.each([null, "", "1", "4", "00", "abc", " 0", "0.0"])("ignora %j", (valor) => {
    expect(ehTesteGratisNaUrl(valor)).toBe(false);
  });

  it("nunca coincide com um plano pago", () => {
    for (const valor of ["0", "1", "2", "3", "4", "9", "abc", null]) {
      expect(ehTesteGratisNaUrl(valor) && lerPlanoDaUrl(valor) !== undefined).toBe(false);
    }
  });
});

describe("descricaoDoTeste", () => {
  it("descreve o teste de 30 dias", () => {
    expect(descricaoDoTeste()).toBe("Teste grátis · 30 dias");
  });
});

describe("lerPlanoDaUrl", () => {
  it("aceita o texto exato 1", () => {
    expect(lerPlanoDaUrl("1")).toBe(1);
  });

  it.each([null, "", "0", "2", "3", "4", "5", "abc", "1.0", " 1", "11"])("ignora %j", (valor) => {
    expect(lerPlanoDaUrl(valor)).toBeUndefined();
  });
});
