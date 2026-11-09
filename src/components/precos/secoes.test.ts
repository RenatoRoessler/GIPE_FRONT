import { describe, expect, it } from "vitest";
import { EMPTY_PRECO_FORM_VALUES, TIPO_CATEGORIA, type PrecoFormValues } from "@/types/preco";
import { diffPreco } from "./diff";
import { estadoDaSecao, idDaSecao, mudancasDaSecao, resumoDaSecao, SECOES, secaoDoElemento } from "./secoes";

const SALVA: PrecoFormValues = {
  info: {
    descricao: "Tarifa padrão",
    tipoRegra: "1",
    inicioVigencia: "2026-11-07T00:00",
    fimVigencia: "",
    toleranciaEntradaMinutos: "0",
    toleranciaAlteracaoFaixaMinutos: "0",
    periodoDiaria: "1440",
    valorDiaria: "100,00",
    valorAdicionalDiaria: "2,00",
    empresaConveniadaId: "",
    ativo: true,
  },
  horarios: [{ diaSemana: "2", horaInicio: "08:00", horaFim: "18:00", dataInicio: "", dataFim: "", ativo: true }],
  faixas: [
    { minutosLimite: "60", valor: "15,00", percentualConveniada: "" },
    { minutosLimite: "120", valor: "25,00", percentualConveniada: "" },
  ],
  categorias: [TIPO_CATEGORIA.Todas],
};

function com(info: Partial<PrecoFormValues["info"]>, resto: Partial<Omit<PrecoFormValues, "info">> = {}): PrecoFormValues {
  return { ...SALVA, ...resto, info: { ...SALVA.info, ...info } };
}

describe("SECOES", () => {
  it("lista as quatro seções na ordem da tela, com ids de elemento que voltam ao id da seção", () => {
    expect(SECOES.map((secao) => secao.id)).toEqual(["basico", "categorias", "horarios", "cobranca"]);
    expect(SECOES.map((secao) => secao.titulo)).toEqual(["O básico", "Categorias", "Quando vale", "Quanto cobra"]);
    expect(secaoDoElemento(idDaSecao("horarios"))).toBe("horarios");
    expect(secaoDoElemento("outro")).toBeNull();
  });
});

describe("estadoDaSecao", () => {
  const base = { mensagens: ["falta"], visitada: false, aberta: false, falhou: false };

  it("sem mensagens a seção está pronta", () => {
    expect(estadoDaSecao({ ...base, mensagens: [] })).toBe("pronta");
    expect(estadoDaSecao({ ...base, mensagens: [], falhou: true })).toBe("pronta");
  });

  it("incompleta e ainda não visitada é só pendente", () => {
    expect(estadoDaSecao(base)).toBe("pendente");
  });

  it("incompleta, visitada e deixada para trás é erro; aberta continua pendente", () => {
    expect(estadoDaSecao({ ...base, visitada: true })).toBe("erro");
    expect(estadoDaSecao({ ...base, visitada: true, aberta: true })).toBe("pendente");
  });

  it("incompleta depois de uma tentativa de salvar que falhou é erro, mesmo aberta", () => {
    expect(estadoDaSecao({ ...base, aberta: true, falhou: true })).toBe("erro");
  });
});

describe("resumoDaSecao", () => {
  it("O básico: tipo e vigência", () => {
    expect(resumoDaSecao("basico", SALVA)).toBe("Padrão · 07/11/2026 → sem fim");
    expect(resumoDaSecao("basico", com({ tipoRegra: "2", fimVigencia: "2026-12-31T23:59", ativo: false }))).toBe(
      "Convênio · inativa · 07/11/2026 → 31/12/2026",
    );
  });

  it("Categorias: nomes ou aviso de que não há nenhuma", () => {
    expect(resumoDaSecao("categorias", SALVA)).toBe("Todas");
    expect(resumoDaSecao("categorias", { ...SALVA, categorias: [TIPO_CATEGORIA.Moto, TIPO_CATEGORIA.CarroPequeno] })).toBe(
      "Moto, Carro pequeno",
    );
    expect(resumoDaSecao("categorias", { ...SALVA, categorias: [] })).toBe("nenhuma ainda");
  });

  it("Quando vale: horários resumidos", () => {
    expect(resumoDaSecao("horarios", SALVA)).toBe("Seg 08:00–18:00");
    expect(resumoDaSecao("horarios", { ...SALVA, horarios: [] })).toBe("nenhum ainda");
  });

  it("Quanto cobra: degraus e diária, ou aviso enquanto são o modelo padrão", () => {
    expect(resumoDaSecao("cobranca", SALVA)).toBe("2 degraus · diária R$ 100,00");
    expect(resumoDaSecao("cobranca", { ...SALVA, faixas: [SALVA.faixas[0]] })).toBe("1 degrau · diária R$ 100,00");
    expect(resumoDaSecao("cobranca", com({ valorDiaria: "" }))).toBe("2 degraus · diária —");
    expect(resumoDaSecao("cobranca", EMPTY_PRECO_FORM_VALUES, { faixasEditadas: false })).toBe(
      "ainda sem valores definidos",
    );
  });
});

describe("mudancasDaSecao", () => {
  it("edição sem mudanças não tem mudanças em nenhuma seção", () => {
    const diff = diffPreco(SALVA, SALVA);
    for (const secao of SECOES) {
      expect(mudancasDaSecao(secao.id, diff)).toEqual([]);
    }
  });

  it("agrupa os campos de info por seção, com antes → depois", () => {
    const atual = com({ descricao: "Nova", valorDiaria: "120,00", toleranciaEntradaMinutos: "10", ativo: false });
    const diff = diffPreco(SALVA, atual);
    expect(mudancasDaSecao("basico", diff)).toEqual([
      { rotulo: "Descrição", antes: "Tarifa padrão", depois: "Nova" },
      { rotulo: "Situação", antes: "Ativo", depois: "Inativo" },
    ]);
    expect(mudancasDaSecao("cobranca", diff)).toEqual([
      { rotulo: "Tolerância de entrada", antes: "0 min", depois: "10 min" },
      { rotulo: "Valor da diária", antes: "R$ 100,00", depois: "R$ 120,00" },
    ]);
    expect(mudancasDaSecao("categorias", diff)).toEqual([]);
    expect(mudancasDaSecao("horarios", diff)).toEqual([]);
  });

  it("listas viram itens removidos (antes) e adicionados (depois)", () => {
    const atual: PrecoFormValues = {
      ...SALVA,
      categorias: [TIPO_CATEGORIA.Moto],
      faixas: [SALVA.faixas[0], { minutosLimite: "180", valor: "30,00", percentualConveniada: "" }],
      horarios: [],
    };
    const diff = diffPreco(SALVA, atual);
    expect(mudancasDaSecao("categorias", diff)).toEqual([
      { rotulo: "Categoria", antes: "Todas" },
      { rotulo: "Categoria", depois: "Moto" },
    ]);
    expect(mudancasDaSecao("horarios", diff)).toEqual([{ rotulo: "Horário", antes: "Segunda-feira: 08:00 às 18:00" }]);
    expect(mudancasDaSecao("cobranca", diff)).toEqual([
      { rotulo: "Degrau", antes: "Até 2 h: R$ 25,00" },
      { rotulo: "Degrau", depois: "Até 3 h: R$ 30,00" },
    ]);
  });
});
