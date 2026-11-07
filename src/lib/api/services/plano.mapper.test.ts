import { describe, expect, it } from "vitest";
import { fromPlanoResponse, planoDtoSchema, type PlanoDto } from "./plano.mapper";

const TRIAL: PlanoDto = {
  planoAdesaoId: 1,
  plano: "TESTE GRATUITO",
  tipoPeriodoPlano: 0,
  validadeDuracaoMeses: 1,
  valor: 0,
  valorAtual: 0,
  emPromocao: false,
  promocaoFim: null,
  ordemExibicao: 1,
};

const MENSAL: PlanoDto = {
  planoAdesaoId: 2,
  plano: "MENSAL",
  tipoPeriodoPlano: 1,
  validadeDuracaoMeses: 1,
  valor: 99.9,
  valorAtual: 69.9,
  emPromocao: true,
  promocaoFim: "2027-06-30T00:00:00",
  ordemExibicao: 2,
};

describe("fromPlanoResponse", () => {
  it("converte os valores em centavos inteiros", () => {
    const plano = fromPlanoResponse(MENSAL);
    expect(plano.centavosTabela).toBe(9990);
    expect(plano.centavosAtual).toBe(6990);
  });

  it("não deixa o ponto flutuante alterar o centavo", () => {
    expect(fromPlanoResponse({ ...MENSAL, valor: 0.29, valorAtual: 0.1 })).toMatchObject({
      centavosTabela: 29,
      centavosAtual: 10,
    });
  });

  it("normaliza o nome em caixa alta", () => {
    expect(fromPlanoResponse(MENSAL).nome).toBe("Mensal");
    expect(fromPlanoResponse(TRIAL).nome).toBe("Teste gratuito");
  });

  it("guarda só a data do fim da promoção, sem passar por Date", () => {
    expect(fromPlanoResponse(MENSAL).promocaoAte).toBe("2027-06-30");
  });

  it("mantém promoção sem data quando promocaoFim é nulo", () => {
    const plano = fromPlanoResponse({ ...MENSAL, promocaoFim: null });
    expect(plano.emPromocao).toBe(true);
    expect(plano.promocaoAte).toBeUndefined();
  });

  it("trata atual não menor que a tabela como sem promoção", () => {
    const plano = fromPlanoResponse({ ...MENSAL, valorAtual: 99.9 });
    expect(plano.emPromocao).toBe(false);
    expect(plano.promocaoAte).toBeUndefined();
  });

  it("não considera promoção quando o back-end diz que não há", () => {
    const plano = fromPlanoResponse({ ...MENSAL, emPromocao: false, valorAtual: 99.9 });
    expect(plano.emPromocao).toBe(false);
    expect(plano.promocaoAte).toBeUndefined();
  });

  it("mapeia o Trial (valor 0)", () => {
    expect(fromPlanoResponse(TRIAL)).toEqual({
      id: 1,
      tipo: 0,
      nome: "Teste gratuito",
      meses: 1,
      centavosTabela: 0,
      centavosAtual: 0,
      emPromocao: false,
      promocaoAte: undefined,
    });
  });

  it("expõe o tipo do período e o id", () => {
    expect(fromPlanoResponse(MENSAL)).toMatchObject({ id: 2, tipo: 1, meses: 1, emPromocao: true });
  });
});

describe("planoDtoSchema", () => {
  it("aceita a resposta do back-end com campos extras e nulos", () => {
    const resposta = {
      ...MENSAL,
      tipoPeriodoPlanoDescricao: "Mensal",
      valorPromocional: 69.9,
      diferencaPercentual: null,
      promocaoInicio: "2026-11-01T00:00:00",
    };
    expect(planoDtoSchema.safeParse(resposta).success).toBe(true);
  });

  it("recusa item sem campo obrigatório", () => {
    expect(planoDtoSchema.safeParse({ ...MENSAL, valorAtual: undefined }).success).toBe(false);
  });
});
