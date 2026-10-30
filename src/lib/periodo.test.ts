import { describe, expect, it } from "vitest";
import { anoCorrente, diasDoPeriodo, formatDataInput, mesAnterior, mesCorrente, validarPeriodo } from "./periodo";

describe("formatDataInput", () => {
  it("usa o dia local, com zeros à esquerda", () => {
    expect(formatDataInput(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDataInput(new Date(2026, 9, 23, 23, 59))).toBe("2026-10-23");
  });
});

describe("mesCorrente", () => {
  it("vai do primeiro ao último dia do mês, não até hoje", () => {
    expect(mesCorrente(new Date(2026, 9, 30))).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(mesCorrente(new Date(2026, 3, 2))).toEqual({ de: "2026-04-01", ate: "2026-04-30" });
  });

  it("fevereiro tem 28 dias, ou 29 em ano bissexto", () => {
    expect(mesCorrente(new Date(2026, 1, 10)).ate).toBe("2026-02-28");
    expect(mesCorrente(new Date(2028, 1, 10)).ate).toBe("2028-02-29");
  });

  it("em dezembro termina no dia 31 do mesmo ano", () => {
    expect(mesCorrente(new Date(2026, 11, 31))).toEqual({ de: "2026-12-01", ate: "2026-12-31" });
  });
});

describe("mesAnterior", () => {
  it("vai do primeiro ao último dia do mês anterior", () => {
    expect(mesAnterior(new Date(2026, 9, 30))).toEqual({ de: "2026-09-01", ate: "2026-09-30" });
    expect(mesAnterior(new Date(2026, 2, 31))).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
  });

  it("em janeiro, é dezembro do ano anterior", () => {
    expect(mesAnterior(new Date(2027, 0, 15))).toEqual({ de: "2026-12-01", ate: "2026-12-31" });
  });
});

describe("anoCorrente", () => {
  it("vai de 1º de janeiro a 31 de dezembro e cabe no limite de 366 dias", () => {
    const periodo = anoCorrente(new Date(2028, 5, 10));
    expect(periodo).toEqual({ de: "2028-01-01", ate: "2028-12-31" });
    expect(diasDoPeriodo(periodo)).toBe(366);
    expect(validarPeriodo(periodo, { maxDias: 366 })).toEqual({});
  });
});

describe("diasDoPeriodo", () => {
  it("conta os dois extremos", () => {
    expect(diasDoPeriodo({ de: "2026-10-01", ate: "2026-10-01" })).toBe(1);
    expect(diasDoPeriodo({ de: "2026-10-01", ate: "2026-10-31" })).toBe(31);
  });

  it("não é afetada pelo horário de verão", () => {
    expect(diasDoPeriodo({ de: "2018-10-01", ate: "2018-11-30" })).toBe(61);
  });
});

describe("validarPeriodo", () => {
  it("período válido não tem erros, inclusive de um dia só", () => {
    expect(validarPeriodo({ de: "2026-10-01", ate: "2026-10-23" })).toEqual({});
    expect(validarPeriodo({ de: "2026-10-01", ate: "2026-10-01" })).toEqual({});
  });

  it("fim antes do início é recusado no campo final", () => {
    expect(validarPeriodo({ de: "2026-10-23", ate: "2026-10-01" })).toEqual({
      ate: "A data final deve ser igual ou posterior à inicial",
    });
  });

  it("datas vazias ou fora do formato são recusadas quando obrigatórias", () => {
    expect(validarPeriodo({ de: "", ate: "" })).toEqual({ de: "Informe a data inicial", ate: "Informe a data final" });
    expect(validarPeriodo({ de: "01/10/2026", ate: "2026-10-23" })).toEqual({ de: "Informe a data inicial" });
  });

  it("aceita 366 dias e recusa 367", () => {
    expect(validarPeriodo({ de: "2026-01-10", ate: "2027-01-10" }, { maxDias: 366 })).toEqual({});
    expect(validarPeriodo({ de: "2026-01-10", ate: "2027-01-11" }, { maxDias: 366 })).toEqual({
      ate: "Escolha um período de até 366 dias",
    });
  });

  it("sem limite, qualquer tamanho vale", () => {
    expect(validarPeriodo({ de: "2020-01-01", ate: "2026-12-31" })).toEqual({});
  });

  it("modo opcional aceita campos vazios, mas não datas malformadas nem invertidas", () => {
    expect(validarPeriodo({ de: "", ate: "" }, { obrigatorio: false })).toEqual({});
    expect(validarPeriodo({ de: "2026-10-01", ate: "" }, { obrigatorio: false })).toEqual({});
    expect(validarPeriodo({ de: "", ate: "2026-10-01" }, { obrigatorio: false })).toEqual({});
    expect(validarPeriodo({ de: "01/10/2026", ate: "" }, { obrigatorio: false })).toEqual({ de: "Informe a data inicial" });
    expect(validarPeriodo({ de: "2026-10-23", ate: "2026-10-01" }, { obrigatorio: false })).toHaveProperty("ate");
  });
});
