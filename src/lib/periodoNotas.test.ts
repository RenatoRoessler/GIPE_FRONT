import { describe, expect, it } from "vitest";
import { formatDataApi, formatDataInput, mesAtual, validarPeriodo } from "./periodoNotas";

describe("formatDataInput", () => {
  it("usa o dia local, com zeros à esquerda", () => {
    expect(formatDataInput(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDataInput(new Date(2026, 9, 23, 23, 59))).toBe("2026-10-23");
  });
});

describe("mesAtual", () => {
  it("vai do primeiro dia do mês até hoje", () => {
    expect(mesAtual(new Date(2026, 9, 23))).toEqual({ de: "2026-10-01", ate: "2026-10-23" });
  });

  it("no primeiro dia do mês, o período é um dia só", () => {
    expect(mesAtual(new Date(2026, 10, 1))).toEqual({ de: "2026-11-01", ate: "2026-11-01" });
  });

  it("na virada do ano, o mês é janeiro do ano novo", () => {
    expect(mesAtual(new Date(2027, 0, 15))).toEqual({ de: "2027-01-01", ate: "2027-01-15" });
  });
});

describe("formatDataApi", () => {
  it("troca os hífens por barras, como o contrato de lançadas", () => {
    expect(formatDataApi("2026-10-01")).toBe("2026/10/01");
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

  it("datas vazias ou fora do formato são recusadas em cada campo", () => {
    expect(validarPeriodo({ de: "", ate: "" })).toEqual({ de: "Informe a data inicial", ate: "Informe a data final" });
    expect(validarPeriodo({ de: "01/10/2026", ate: "2026-10-23" })).toEqual({ de: "Informe a data inicial" });
  });

  it("compara o ano antes do mês", () => {
    expect(validarPeriodo({ de: "2026-12-31", ate: "2027-01-01" })).toEqual({});
    expect(validarPeriodo({ de: "2027-01-01", ate: "2026-12-31" })).toHaveProperty("ate");
  });
});
