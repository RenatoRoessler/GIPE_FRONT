import { describe, expect, it } from "vitest";
import { SEM_VALOR, brl, brlCompacto, dataCurta, dataPorExtenso, diaSemanaCurto, horaCurta, nomeDoMes, percentual, permanencia } from "./format";

const hoje = new Date(2026, 10, 19);

describe("brl", () => {
  it("mostra centavos quando pedido", () => {
    expect(brl(1403.5, { centavos: true })).toBe(`R$ 1.403,50`);
    expect(brl(0, { centavos: true })).toBe(`R$ 0,00`);
  });

  it("arredonda para reais inteiros por padrão", () => {
    expect(brl(2591.08)).toBe(`R$ 2.591`);
    expect(brl(107.96)).toBe(`R$ 108`);
    expect(brl(1.5)).toBe(`R$ 2`);
  });

  it("mantém o sinal de valor negativo", () => {
    expect(brl(-35, { centavos: true })).toContain("35,00");
    expect(brl(-35, { centavos: true })).toMatch(/-/);
  });

  it("nulo, indefinido e NaN nunca viram R$ 0", () => {
    expect(brl(null)).toBe(SEM_VALOR);
    expect(brl(undefined)).toBe(SEM_VALOR);
    expect(brl(Number.NaN, { centavos: true })).toBe(SEM_VALOR);
  });
});

describe("brlCompacto", () => {
  it("omite os centavos de valor inteiro e mostra os de valor quebrado", () => {
    expect(brlCompacto(250)).toBe("R$ 250");
    expect(brlCompacto(2310)).toBe("R$ 2.310");
    expect(brlCompacto(1.5)).toBe("R$ 1,50");
    expect(brlCompacto(35.25)).toBe("R$ 35,25");
  });

  it("nulo vira o travessão", () => {
    expect(brlCompacto(null)).toBe(SEM_VALOR);
  });
});

describe("percentual", () => {
  it("usa o módulo, sem casas, porque a seta mostra o sentido", () => {
    expect(percentual(-100)).toBe("100%");
    expect(percentual(14.01)).toBe("14%");
    expect(percentual(-3.6)).toBe("4%");
  });

  it("nulo vira o travessão", () => {
    expect(percentual(null)).toBe(SEM_VALOR);
  });
});

describe("permanencia", () => {
  it("formata em minutos, horas e dias", () => {
    expect(permanencia(45)).toBe("45min");
    expect(permanencia(112)).toBe("1h 52min");
    expect(permanencia(15862)).toBe("11d 0h");
    expect(permanencia(51.6)).toBe("52min");
  });

  it("nulo vira o travessão", () => {
    expect(permanencia(null)).toBe(SEM_VALOR);
  });
});

describe("datas", () => {
  it("dataCurta traz o ano só quando difere do ano de hoje", () => {
    expect(dataCurta(new Date(2026, 10, 18), hoje)).toBe("18 nov");
    expect(dataCurta(new Date(2025, 11, 31), hoje)).toBe("31 dez 2025");
  });

  it("dia da semana curto, mês e data por extenso", () => {
    expect(diaSemanaCurto(new Date(2026, 10, 18))).toBe("qua");
    expect(diaSemanaCurto(new Date(2026, 10, 15))).toBe("dom");
    expect(nomeDoMes(new Date(2026, 9, 1), hoje)).toBe("outubro");
    expect(nomeDoMes(new Date(2025, 9, 1), hoje)).toBe("outubro de 2025");
    expect(dataPorExtenso(hoje)).toBe("Quinta, 19 de novembro");
  });

  it("horaCurta completa com zero à esquerda", () => {
    expect(horaCurta(new Date(2026, 10, 19, 9, 5))).toBe("09:05");
    expect(horaCurta(new Date(2026, 10, 19, 15, 45))).toBe("15:45");
  });
});
