import { describe, expect, it } from "vitest";
import type { PlanoAdesao } from "@/types/plano";
import {
  CONDICOES_DO_TESTE,
  descreverCondicao,
  descreverDuracao,
  descreverParaLeitor,
  descricaoNaCredencial,
  ehTesteGratisNaUrl,
  formatarDataPromocao,
  formatarReais,
  lerPlanoDaUrl,
  planoDoTipo,
  rotuloDoSelo,
} from "./planos";

const TRIAL: PlanoAdesao = {
  id: 1,
  tipo: 0,
  nome: "Teste gratuito",
  meses: 1,
  centavosTabela: 0,
  centavosAtual: 0,
  emPromocao: false,
};

const MENSAL_PROMO: PlanoAdesao = {
  id: 2,
  tipo: 1,
  nome: "Mensal",
  meses: 1,
  centavosTabela: 9990,
  centavosAtual: 6990,
  emPromocao: true,
  promocaoAte: "2027-06-30",
};

const MENSAL_PROMO_SEM_DATA: PlanoAdesao = { ...MENSAL_PROMO, promocaoAte: undefined };
const MENSAL: PlanoAdesao = { ...MENSAL_PROMO, centavosAtual: 9990, emPromocao: false, promocaoAte: undefined };

describe("formatarReais", () => {
  it("formata em reais com espaço comum", () => {
    expect(formatarReais(6990)).toBe("R$ 69,90");
    expect(formatarReais(9990)).toBe("R$ 99,90");
    expect(formatarReais(0)).toBe("R$ 0,00");
  });
});

describe("formatarDataPromocao", () => {
  it("inverte a data sem passar por Date", () => {
    expect(formatarDataPromocao("2027-06-30")).toBe("30/06/2027");
    expect(formatarDataPromocao("2027-01-05")).toBe("05/01/2027");
  });
});

describe("descreverDuracao", () => {
  it("usa o singular para 1 mês e o plural para os demais", () => {
    expect(descreverDuracao(1)).toBe("1 mês");
    expect(descreverDuracao(2)).toBe("2 meses");
    expect(descreverDuracao(12)).toBe("12 meses");
  });
});

describe("descreverCondicao", () => {
  it("em promoção com data: vale até a data e depois volta à tabela", () => {
    expect(descreverCondicao(MENSAL_PROMO)).toBe("R$ 69,90/mês até 30/06/2027; depois, R$ 99,90/mês.");
  });

  it("em promoção sem data: não cita data nem o preço depois", () => {
    expect(descreverCondicao(MENSAL_PROMO_SEM_DATA)).toBe("R$ 69,90/mês em promoção.");
  });

  it("sem promoção: cobrado todo mês", () => {
    expect(descreverCondicao(MENSAL)).toBe("Cobrado todo mês");
  });

  it("nunca fala em 12 meses", () => {
    for (const plano of [MENSAL_PROMO, MENSAL_PROMO_SEM_DATA, MENSAL]) {
      expect(descreverCondicao(plano)).not.toMatch(/12 meses/);
    }
  });
});

describe("rotuloDoSelo", () => {
  it("mostra a data de fim quando há", () => {
    expect(rotuloDoSelo(MENSAL_PROMO)).toBe("Promoção até 30/06/2027");
  });

  it("mostra só Promoção quando não há data", () => {
    expect(rotuloDoSelo(MENSAL_PROMO_SEM_DATA)).toBe("Promoção");
  });

  it("não mostra selo sem promoção", () => {
    expect(rotuloDoSelo(MENSAL)).toBeUndefined();
    expect(rotuloDoSelo(TRIAL)).toBeUndefined();
  });
});

describe("descreverParaLeitor", () => {
  it("diz de quanto por quanto e até quando na promoção", () => {
    expect(descreverParaLeitor(MENSAL_PROMO)).toBe(
      "Mensal, de R$ 99,90 por R$ 69,90 por mês, promoção até 30/06/2027",
    );
  });

  it("na promoção sem data não cita data", () => {
    expect(descreverParaLeitor(MENSAL_PROMO_SEM_DATA)).toBe("Mensal, de R$ 99,90 por R$ 69,90 por mês, em promoção");
  });

  it("sem promoção cita só o valor atual", () => {
    expect(descreverParaLeitor(MENSAL)).toBe("Mensal, R$ 99,90 por mês, cobrado todo mês");
  });

  it("no teste cita a duração e as condições", () => {
    expect(descreverParaLeitor(TRIAL)).toBe(`Teste gratuito, 1 mês. ${CONDICOES_DO_TESTE}`);
  });
});

describe("descricaoNaCredencial", () => {
  it("descreve o plano pago com o valor atual", () => {
    expect(descricaoNaCredencial(MENSAL_PROMO, 1)).toBe("Mensal · R$ 69,90/mês");
  });

  it("descreve o teste com a duração do back-end", () => {
    expect(descricaoNaCredencial(TRIAL, 0)).toBe("Teste grátis · 1 mês");
  });

  it("descreve o teste sem número quando não há dados", () => {
    expect(descricaoNaCredencial(undefined, 0)).toBe("Teste grátis");
  });

  it("fica vazio sem plano escolhido ou sem dados do plano pago", () => {
    expect(descricaoNaCredencial(undefined, undefined)).toBeUndefined();
    expect(descricaoNaCredencial(undefined, 1)).toBeUndefined();
  });
});

describe("planoDoTipo", () => {
  it("acha o plano pelo tipo", () => {
    expect(planoDoTipo([TRIAL, MENSAL_PROMO], 1)).toBe(MENSAL_PROMO);
    expect(planoDoTipo([TRIAL, MENSAL_PROMO], 0)).toBe(TRIAL);
  });

  it("devolve undefined quando não há lista, tipo ou plano com esse tipo", () => {
    expect(planoDoTipo(undefined, 1)).toBeUndefined();
    expect(planoDoTipo([TRIAL], undefined)).toBeUndefined();
    expect(planoDoTipo([TRIAL, MENSAL_PROMO], 9)).toBeUndefined();
  });
});

describe("ehTesteGratisNaUrl", () => {
  it("aceita só o texto exato 0", () => {
    expect(ehTesteGratisNaUrl("0")).toBe(true);
  });

  it.each([null, "", "1", "4", "00", "abc", " 0", "0.0"])("ignora %j", (valor) => {
    expect(ehTesteGratisNaUrl(valor)).toBe(false);
  });

  it("nunca coincide com um plano lido da URL", () => {
    for (const valor of ["0", "1", "2", "3", "4", "9", "abc", null]) {
      expect(ehTesteGratisNaUrl(valor) && lerPlanoDaUrl(valor) !== undefined).toBe(false);
    }
  });
});

describe("lerPlanoDaUrl", () => {
  it.each([
    ["1", 1],
    ["2", 2],
    ["4", 4],
    ["11", 11],
  ])("aceita o inteiro positivo %j", (valor, esperado) => {
    expect(lerPlanoDaUrl(valor)).toBe(esperado);
  });

  it.each([null, "", "0", "-1", "1.5", "1.0", "abc", " 1", "1 ", "01", "+1", "99999999999999999999"])(
    "ignora %j",
    (valor) => {
      expect(lerPlanoDaUrl(valor)).toBeUndefined();
    },
  );
});
