import { describe, expect, it } from "vitest";
import { EMPTY_PRECO_FORM_VALUES, TIPO_CATEGORIA, type PrecoFormValues } from "@/types/preco";
import { findInvalidPrecoStep, validarEtapasPreco } from "./preco";

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

describe("validarEtapasPreco", () => {
  it("tabela válida não tem pendência em nenhuma etapa", () => {
    expect(validarEtapasPreco(VALIDO)).toEqual({ basico: [], horarios: [], cobranca: [] });
    expect(findInvalidPrecoStep(VALIDO)).toBeNull();
  });

  it("descrição vazia pendencia só 'O básico'", () => {
    const etapas = validarEtapasPreco(com({ info: { descricao: "" } }));
    expect(etapas.basico).toEqual(["Informe a descrição"]);
    expect(etapas.horarios).toEqual([]);
    expect(etapas.cobranca).toEqual([]);
  });

  it("sem categoria pendencia 'O básico'", () => {
    expect(validarEtapasPreco(com({ categorias: [] })).basico).toEqual(["Selecione ao menos uma categoria"]);
  });

  it("'Todas' combinada com outra categoria pendencia 'O básico'", () => {
    const etapas = validarEtapasPreco(com({ categorias: [TIPO_CATEGORIA.Todas, TIPO_CATEGORIA.Moto] }));
    expect(etapas.basico).toHaveLength(1);
  });

  it("fim anterior ao início pendencia 'O básico'", () => {
    const etapas = validarEtapasPreco(com({ info: { fimVigencia: "2026-10-01T00:00" } }));
    expect(etapas.basico).toEqual(["O fim deve ser posterior ao início da vigência"]);
  });

  it("sem horário pendencia 'Quando vale'", () => {
    const etapas = validarEtapasPreco(com({ horarios: [] }));
    expect(etapas.horarios).toEqual(["Cadastre ao menos um horário"]);
    expect(etapas.basico).toEqual([]);
  });

  it("diária vazia e tolerância inválida pendenciam 'Quanto cobra'", () => {
    const etapas = validarEtapasPreco(com({ info: { valorDiaria: "", toleranciaEntradaMinutos: "a" } }));
    expect(etapas.cobranca).toContain("Informe o valor da diária");
    expect(etapas.cobranca).toContain("Use um número inteiro de minutos");
    expect(etapas.basico).toEqual([]);
  });

  it("faixa repetida pendencia 'Quanto cobra'", () => {
    const etapas = validarEtapasPreco(
      com({
        faixas: [
          { minutosLimite: "60", valor: "10,00", percentualConveniada: "" },
          { minutosLimite: "60", valor: "12,00", percentualConveniada: "" },
        ],
      }),
    );
    expect(etapas.cobranca).toEqual(["Já existe uma faixa com esse limite"]);
  });

  it("o cadastro vazio começa com as três etapas pendentes", () => {
    const etapas = validarEtapasPreco(EMPTY_PRECO_FORM_VALUES);
    expect(etapas.basico.length).toBeGreaterThan(0);
    expect(etapas.horarios.length).toBeGreaterThan(0);
    expect(etapas.cobranca.length).toBeGreaterThan(0);
  });
});

describe("findInvalidPrecoStep", () => {
  it("devolve a primeira etapa com erro, na ordem das etapas", () => {
    expect(findInvalidPrecoStep(com({ info: { descricao: "" }, horarios: [] }))).toBe(1);
    expect(findInvalidPrecoStep(com({ horarios: [], faixas: [] }))).toBe(2);
    expect(findInvalidPrecoStep(com({ faixas: [] }))).toBe(3);
  });
});
