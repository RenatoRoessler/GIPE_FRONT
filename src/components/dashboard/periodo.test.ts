import { describe, expect, it } from "vitest";
import { PERIODO_DASHBOARD } from "@/types/dashboard";
import { TIPO_PARA_API, deslocar, ehPeriodoAtual, limitesDoPeriodo, podeVoltar, rotuloDoPeriodo } from "./periodo";

// Quinta, 19 de novembro de 2026.
const hoje = new Date(2026, 10, 19);
const d = (ano: number, mes: number, dia: number) => new Date(ano, mes - 1, dia);

describe("limitesDoPeriodo", () => {
  it("dia: começa e termina no mesmo dia", () => {
    expect(limitesDoPeriodo("dia", new Date(2026, 10, 19, 15, 45))).toEqual({ inicio: d(2026, 11, 19), fim: d(2026, 11, 19) });
  });

  it("semana: de segunda a domingo", () => {
    expect(limitesDoPeriodo("semana", d(2026, 11, 19))).toEqual({ inicio: d(2026, 11, 16), fim: d(2026, 11, 22) });
    // Domingo pertence à semana que termina nele.
    expect(limitesDoPeriodo("semana", d(2026, 11, 22))).toEqual({ inicio: d(2026, 11, 16), fim: d(2026, 11, 22) });
    // Segunda abre a semana.
    expect(limitesDoPeriodo("semana", d(2026, 11, 16))).toEqual({ inicio: d(2026, 11, 16), fim: d(2026, 11, 22) });
  });

  it("semana que atravessa o mês e o ano", () => {
    expect(limitesDoPeriodo("semana", d(2026, 10, 28))).toEqual({ inicio: d(2026, 10, 26), fim: d(2026, 11, 1) });
    expect(limitesDoPeriodo("semana", d(2026, 1, 1))).toEqual({ inicio: d(2025, 12, 29), fim: d(2026, 1, 4) });
  });

  it("mês: do primeiro ao último dia, inclusive fevereiro bissexto", () => {
    expect(limitesDoPeriodo("mes", d(2026, 11, 19))).toEqual({ inicio: d(2026, 11, 1), fim: d(2026, 11, 30) });
    expect(limitesDoPeriodo("mes", d(2028, 2, 10))).toEqual({ inicio: d(2028, 2, 1), fim: d(2028, 2, 29) });
  });
});

describe("deslocar", () => {
  it("anda um dia, uma semana ou um mês", () => {
    expect(deslocar("dia", d(2026, 11, 19), -1)).toEqual(d(2026, 11, 18));
    expect(deslocar("semana", d(2026, 11, 19), -1)).toEqual(d(2026, 11, 12));
    expect(deslocar("mes", d(2026, 11, 19), -1)).toEqual(d(2026, 10, 1));
  });

  it("anda para a frente", () => {
    expect(deslocar("dia", d(2026, 11, 19), 1)).toEqual(d(2026, 11, 20));
    expect(deslocar("semana", d(2026, 11, 12), 1)).toEqual(d(2026, 11, 19));
    expect(deslocar("mes", d(2026, 10, 15), 1)).toEqual(d(2026, 11, 1));
  });

  it("o mês não pula meses curtos: de 31 de março volta a fevereiro", () => {
    expect(deslocar("mes", d(2026, 3, 31), -1)).toEqual(d(2026, 2, 1));
    expect(deslocar("mes", d(2026, 1, 31), 1)).toEqual(d(2026, 2, 1));
  });

  it("atravessa a virada de ano", () => {
    expect(deslocar("dia", d(2026, 1, 1), -1)).toEqual(d(2025, 12, 31));
    expect(deslocar("mes", d(2026, 1, 15), -1)).toEqual(d(2025, 12, 1));
    expect(deslocar("mes", d(2025, 12, 31), 1)).toEqual(d(2026, 1, 1));
  });
});

describe("ehPeriodoAtual", () => {
  it("reconhece o dia, a semana e o mês que contêm hoje", () => {
    expect(ehPeriodoAtual("dia", hoje, hoje)).toBe(true);
    expect(ehPeriodoAtual("semana", d(2026, 11, 16), hoje)).toBe(true);
    expect(ehPeriodoAtual("semana", d(2026, 11, 22), hoje)).toBe(true);
    expect(ehPeriodoAtual("mes", d(2026, 11, 1), hoje)).toBe(true);
  });

  it("períodos passados não são o atual", () => {
    expect(ehPeriodoAtual("dia", d(2026, 11, 18), hoje)).toBe(false);
    expect(ehPeriodoAtual("semana", d(2026, 11, 15), hoje)).toBe(false);
    expect(ehPeriodoAtual("mes", d(2026, 10, 31), hoje)).toBe(false);
  });

  it("ignora a hora do dia", () => {
    expect(ehPeriodoAtual("dia", new Date(2026, 10, 19, 23, 59), new Date(2026, 10, 19, 0, 1))).toBe(true);
  });
});

describe("podeVoltar", () => {
  const inicioUso = new Date(2026, 10, 7, 11, 53);

  it("empresa nova não tem para onde voltar", () => {
    expect(podeVoltar("dia", hoje, null)).toBe(false);
    expect(podeVoltar("semana", hoje, null)).toBe(false);
    expect(podeVoltar("mes", hoje, null)).toBe(false);
  });

  it("dia: volta até o dia do início do uso, mas não antes dele", () => {
    expect(podeVoltar("dia", d(2026, 11, 19), inicioUso)).toBe(true);
    expect(podeVoltar("dia", d(2026, 11, 8), inicioUso)).toBe(true);
    expect(podeVoltar("dia", d(2026, 11, 7), inicioUso)).toBe(false);
  });

  it("semana: para na semana que contém o início do uso", () => {
    expect(podeVoltar("semana", d(2026, 11, 19), inicioUso)).toBe(true);
    // Semana de 9 a 15: a anterior (2 a 8) contém o dia 7.
    expect(podeVoltar("semana", d(2026, 11, 12), inicioUso)).toBe(true);
    // Semana de 2 a 8 contém o início do uso: não volta mais.
    expect(podeVoltar("semana", d(2026, 11, 5), inicioUso)).toBe(false);
  });

  it("mês: para no mês que contém o início do uso", () => {
    expect(podeVoltar("mes", d(2026, 12, 1), inicioUso)).toBe(true);
    expect(podeVoltar("mes", d(2026, 11, 19), inicioUso)).toBe(false);
    expect(podeVoltar("mes", d(2026, 11, 19), new Date(2026, 9, 31, 8, 0))).toBe(true);
    expect(podeVoltar("mes", d(2026, 10, 15), new Date(2026, 9, 31, 8, 0))).toBe(false);
  });
});

describe("rotuloDoPeriodo", () => {
  it("dia: hoje, ontem e os demais com o dia da semana", () => {
    expect(rotuloDoPeriodo("dia", hoje, hoje)).toBe("Hoje · 19 nov");
    expect(rotuloDoPeriodo("dia", d(2026, 11, 18), hoje)).toBe("Ontem · 18 nov");
    expect(rotuloDoPeriodo("dia", d(2026, 11, 11), hoje)).toBe("Qua · 11 nov");
  });

  it("dia: o ano só aparece quando é diferente do atual", () => {
    expect(rotuloDoPeriodo("dia", d(2025, 12, 31), hoje)).toBe("Qua · 31 dez 2025");
  });

  it("semana: a atual leva o prefixo e as demais só a faixa", () => {
    expect(rotuloDoPeriodo("semana", hoje, hoje)).toBe("Esta semana · 16 – 22 nov");
    expect(rotuloDoPeriodo("semana", d(2026, 11, 12), hoje)).toBe("9 – 15 nov");
  });

  it("semana: atravessando o mês mostra os dois meses", () => {
    expect(rotuloDoPeriodo("semana", d(2026, 10, 28), hoje)).toBe("26 out – 1 nov");
  });

  it("semana: atravessando o ano mostra o ano onde difere do atual", () => {
    expect(rotuloDoPeriodo("semana", d(2025, 12, 31), hoje)).toBe("29 dez 2025 – 4 jan");
  });

  it("mês: nome e ano", () => {
    expect(rotuloDoPeriodo("mes", d(2026, 10, 15), hoje)).toBe("Outubro 2026");
    expect(rotuloDoPeriodo("mes", hoje, hoje)).toBe("Novembro 2026");
    expect(rotuloDoPeriodo("mes", d(2025, 3, 2), hoje)).toBe("Março 2025");
  });
});

describe("TIPO_PARA_API", () => {
  it("mapeia o tipo da tela para o código da API", () => {
    expect(TIPO_PARA_API).toEqual({ dia: PERIODO_DASHBOARD.Dia, semana: PERIODO_DASHBOARD.Semana, mes: PERIODO_DASHBOARD.Mes });
  });
});
