import { describe, expect, it } from "vitest";
import { TipoPlanoAdesao } from "@/types/plano";
import {
  buscarPlano,
  calcularCondicoes,
  descreverEconomia,
  descreverTotal,
  descricaoDoTeste,
  ehTesteGratisNaUrl,
  formatarReais,
  lerPlanoDaUrl,
  PLANOS,
} from "./planos";

describe("PLANOS", () => {
  it("tem os quatro planos na ordem e só o Anual recomendado", () => {
    expect(PLANOS.map((plano) => plano.nome)).toEqual(["Mensal", "Trimestral", "Semestral", "Anual"]);
    expect(PLANOS.map((plano) => plano.tipo)).toEqual([1, 2, 3, 4]);
    expect(PLANOS.filter((plano) => plano.recomendado).map((plano) => plano.nome)).toEqual(["Anual"]);
  });
});

describe("calcularCondicoes", () => {
  it("calcula total, economia e percentual de cada plano", () => {
    expect(PLANOS.map((plano) => calcularCondicoes(plano).totalCentavos)).toEqual([14990, 40470, 71940, 95880]);
    expect(PLANOS.map((plano) => calcularCondicoes(plano).economiaCentavos)).toEqual([0, 4500, 18000, 84000]);
    expect(PLANOS.map((plano) => calcularCondicoes(plano).economiaPercentual)).toEqual([0, 10, 20, 47]);
  });
});

describe("formatarReais", () => {
  it("formata em reais com espaço comum", () => {
    expect(formatarReais(7990)).toBe("R$ 79,90");
    expect(formatarReais(95880)).toBe("R$ 958,80");
  });
});

describe("descreverTotal", () => {
  it("descreve o total de cada plano", () => {
    expect(PLANOS.map(descreverTotal)).toEqual([
      "Cobrado todo mês",
      "R$ 404,70 por 3 meses",
      "R$ 719,40 por 6 meses",
      "R$ 958,80 em uma cobrança única",
    ]);
  });
});

describe("descreverEconomia", () => {
  it("não tem economia no Mensal", () => {
    expect(descreverEconomia(PLANOS[0])).toBeUndefined();
  });

  it("descreve a economia dos demais planos", () => {
    expect(PLANOS.slice(1).map(descreverEconomia)).toEqual([
      "Economia de R$ 45,00 (10%)",
      "Economia de R$ 180,00 (20%)",
      "Economia de R$ 840,00 (47%)",
    ]);
  });
});

describe("buscarPlano", () => {
  it("devolve o plano do tipo", () => {
    expect(buscarPlano(TipoPlanoAdesao.Semestral).nome).toBe("Semestral");
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
  it.each([
    ["1", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
  ])("aceita %s", (valor, esperado) => {
    expect(lerPlanoDaUrl(valor)).toBe(esperado);
  });

  it.each([null, "", "0", "5", "9", "abc", "2.0", " 2", "12"])("ignora %j", (valor) => {
    expect(lerPlanoDaUrl(valor)).toBeUndefined();
  });
});
