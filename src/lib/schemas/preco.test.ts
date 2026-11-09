import { describe, expect, it } from "vitest";
import { EMPTY_PRECO_FORM_VALUES, TIPO_CATEGORIA, type PrecoFormValues } from "@/types/preco";
import { findInvalidPrecoSecao, validarSecoesPreco } from "./preco";

const VALIDO: PrecoFormValues = {
  info: {
    descricao: "Tarifa padrão",
    tipoRegra: "1",
    inicioVigencia: "2026-11-01T00:00",
    fimVigencia: "",
    toleranciaEntradaMinutos: "10",
    toleranciaAlteracaoFaixaMinutos: "0",
    periodoDiaria: "1440",
    valorDiaria: "70,00",
    valorAdicionalDiaria: "2,00",
    empresaConveniadaId: "",
    ativo: true,
  },
  horarios: [{ diaSemana: "2", horaInicio: "08:00", horaFim: "18:00", dataInicio: "", dataFim: "", ativo: true }],
  faixas: [{ minutosLimite: "60", valor: "15,00", percentualConveniada: "" }],
  categorias: [TIPO_CATEGORIA.Todas],
};

type Parcial = Omit<Partial<PrecoFormValues>, "info"> & { info?: Partial<PrecoFormValues["info"]> };

function com(parcial: Parcial): PrecoFormValues {
  return { ...VALIDO, ...parcial, info: { ...VALIDO.info, ...parcial.info } };
}

describe("validarSecoesPreco: mensagens de cada seção", () => {
  it("tabela válida não tem pendência em nenhuma seção", () => {
    expect(validarSecoesPreco(VALIDO)).toEqual({ basico: [], categorias: [], horarios: [], cobranca: [] });
  });

  it("descrição vazia pendencia só 'O básico'", () => {
    const secoes = validarSecoesPreco(com({ info: { descricao: "" } }));
    expect(secoes.basico).toEqual(["Informe a descrição"]);
    expect(secoes.horarios).toEqual([]);
    expect(secoes.cobranca).toEqual([]);
  });

  it("sem categoria pendencia 'Categorias'", () => {
    expect(validarSecoesPreco(com({ categorias: [] })).categorias).toEqual(["Selecione ao menos uma categoria"]);
  });

  it("'Todas' combinada com outra categoria pendencia 'Categorias'", () => {
    const secoes = validarSecoesPreco(com({ categorias: [TIPO_CATEGORIA.Todas, TIPO_CATEGORIA.Moto] }));
    expect(secoes.categorias).toHaveLength(1);
    expect(secoes.basico).toEqual([]);
  });

  it("fim anterior ao início pendencia 'O básico'", () => {
    const secoes = validarSecoesPreco(com({ info: { fimVigencia: "2026-10-01T00:00" } }));
    expect(secoes.basico).toEqual(["O fim deve ser posterior ao início da vigência"]);
  });

  it("tipo Convênio exige a empresa conveniada", () => {
    const secoes = validarSecoesPreco(com({ info: { tipoRegra: "2", empresaConveniadaId: "" } }));
    expect(secoes.basico).toEqual(["Selecione a empresa conveniada"]);
    expect(validarSecoesPreco(com({ info: { tipoRegra: "2", empresaConveniadaId: "4" } })).basico).toEqual([]);
  });

  it("empresa conveniada exige o tipo Convênio", () => {
    const secoes = validarSecoesPreco(com({ info: { tipoRegra: "1", empresaConveniadaId: "4" } }));
    expect(secoes.basico).toEqual(["Com empresa conveniada, selecione o tipo Convênio"]);
  });

  it("sem horário pendencia 'Quando vale'", () => {
    const secoes = validarSecoesPreco(com({ horarios: [] }));
    expect(secoes.horarios).toEqual(["Cadastre ao menos um horário"]);
    expect(secoes.basico).toEqual([]);
  });

  it("diária vazia e tolerância inválida pendenciam 'Quanto cobra'", () => {
    const secoes = validarSecoesPreco(com({ info: { valorDiaria: "", toleranciaEntradaMinutos: "a" } }));
    expect(secoes.cobranca).toContain("Informe o valor da diária");
    expect(secoes.cobranca).toContain("Use um número inteiro de minutos");
    expect(secoes.basico).toEqual([]);
  });

  it("faixa repetida pendencia 'Quanto cobra'", () => {
    const secoes = validarSecoesPreco(
      com({
        faixas: [
          { minutosLimite: "60", valor: "10,00", percentualConveniada: "" },
          { minutosLimite: "60", valor: "12,00", percentualConveniada: "" },
        ],
      }),
    );
    expect(secoes.cobranca).toEqual(["Já existe uma faixa com esse limite"]);
  });

  it("o cadastro vazio começa com as quatro seções pendentes", () => {
    const secoes = validarSecoesPreco(EMPTY_PRECO_FORM_VALUES);
    expect(secoes.basico.length).toBeGreaterThan(0);
    expect(secoes.categorias.length).toBeGreaterThan(0);
    expect(secoes.horarios.length).toBeGreaterThan(0);
    expect(secoes.cobranca.length).toBeGreaterThan(0);
  });
});

describe("validarSecoesPreco", () => {
  it("devolve todas as seções vazias para uma tabela válida", () => {
    expect(validarSecoesPreco(VALIDO)).toEqual({ basico: [], categorias: [], horarios: [], cobranca: [] });
  });

  it("aponta uma pendência em cada seção", () => {
    expect(validarSecoesPreco(com({ info: { descricao: "" } })).basico).toEqual(["Informe a descrição"]);
    expect(validarSecoesPreco(com({ categorias: [] })).categorias).toEqual(["Selecione ao menos uma categoria"]);
    expect(validarSecoesPreco(com({ horarios: [] })).horarios).toEqual(["Cadastre ao menos um horário"]);
    expect(validarSecoesPreco(com({ faixas: [] })).cobranca).toEqual(["Cadastre ao menos uma faixa de valor"]);
  });

  it("junta várias pendências ao mesmo tempo", () => {
    const secoes = validarSecoesPreco(com({ info: { descricao: "" }, categorias: [], horarios: [], faixas: [] }));
    expect(Object.values(secoes).every((mensagens) => mensagens.length > 0)).toBe(true);
  });

});

describe("findInvalidPrecoSecao", () => {
  it("devolve a primeira seção com erro, na ordem da tela", () => {
    expect(findInvalidPrecoSecao(com({ info: { descricao: "" }, categorias: [] }))).toBe("basico");
    expect(findInvalidPrecoSecao(com({ categorias: [], horarios: [] }))).toBe("categorias");
    expect(findInvalidPrecoSecao(com({ horarios: [], faixas: [] }))).toBe("horarios");
    expect(findInvalidPrecoSecao(com({ faixas: [] }))).toBe("cobranca");
  });

  it("devolve null para uma tabela válida", () => {
    expect(findInvalidPrecoSecao(VALIDO)).toBeNull();
  });
});
