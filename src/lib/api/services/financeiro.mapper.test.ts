import { describe, expect, it } from "vitest";
import { TIPO_LANCAMENTO, type Lancamento, type LancamentoFormValues } from "@/types/financeiro";
import {
  fromCategoriaResponse,
  fromFluxoResponse,
  fromLancamentoResponse,
  toCategoriaPayload,
  toLancamentoPayload,
} from "./financeiro.mapper";

const formulario: LancamentoFormValues = {
  tipo: "2",
  financeiroCategoriaId: "7",
  descricao: "  Conta de luz ",
  valor: "R$ 1.234,50",
  dataPagamento: "2026-10-22",
  formaPagamento: "2",
  favorecido: "  ",
  documento: " NF 1234 ",
  observacao: "",
  peloCaixa: false,
};

const atualPeloCaixa: Lancamento = {
  financeiroLancamentoId: 9,
  financeiroCategoriaId: 7,
  categoria: "Troco",
  categoriaPai: null,
  tipo: TIPO_LANCAMENTO.Saida,
  descricao: "Troco do cofre",
  valor: 100,
  dataPagamento: "2026-10-30",
  formaPagamento: 1,
  favorecido: null,
  documento: null,
  observacao: null,
  peloCaixa: true,
  cancelado: false,
  canceladoPor: null,
};

describe("fromFluxoResponse", () => {
  it("lê o fluxo do back, em reais, com as datas cortadas", () => {
    const fluxo = fromFluxoResponse({
      dataInicio: "2026-10-01T00:00:00",
      dataFim: "2026-10-31",
      agrupamento: 2,
      totalEntradas: 75110,
      totalSaidas: 0,
      saldo: 75110,
      categorias: [{ origem: 1, tipo: 1, financeiroCategoriaId: null, categoria: "Estacionamento rotativo", financeiroCategoriaPaiId: null, categoriaPai: null, valor: 74810 }],
      periodos: [{ data: "2026-10-01", entradas: 75110, saidas: 0, saldo: 75110, saldoAcumulado: 75110 }],
    });

    expect(fluxo.dataInicio).toBe("2026-10-01");
    expect(fluxo.agrupamento).toBe(2);
    expect(fluxo.categorias[0]).toMatchObject({ origem: 1, tipo: 1, financeiroCategoriaId: null, valor: 74810 });
    expect(fluxo.periodos).toEqual([{ data: "2026-10-01", entradas: 75110, saidas: 0, saldo: 75110, saldoAcumulado: 75110 }]);
  });

  it("dado ausente ou inválido nunca vira NaN nem quebra a leitura", () => {
    const fluxo = fromFluxoResponse({ totalEntradas: "abc", periodos: [{ data: "2026-10-01", entradas: null }], categorias: "x" });

    expect(fluxo.totalEntradas).toBe(0);
    expect(fluxo.totalSaidas).toBe(0);
    expect(fluxo.categorias).toEqual([]);
    expect(fluxo.periodos[0]).toEqual({ data: "2026-10-01", entradas: 0, saidas: 0, saldo: 0, saldoAcumulado: 0 });
    expect(fluxo.agrupamento).toBe(1);
  });
});

describe("fromLancamentoResponse", () => {
  it("lê os campos, corta a data e lê o valor sempre sem sinal", () => {
    const lancamento = fromLancamentoResponse({
      financeiroLancamentoId: 3,
      financeiroCategoriaId: 7,
      categoria: "Energia",
      categoriaPai: "Despesas fixas",
      tipo: 2,
      descricao: "Conta de luz",
      valor: -450,
      dataPagamento: "2026-10-22T00:00:00",
      formaPagamento: 2,
      favorecido: "Cia. Elétrica",
      documento: "",
      peloCaixa: true,
      cancelado: false,
    });

    expect(lancamento).toMatchObject({
      financeiroLancamentoId: 3,
      categoria: "Energia",
      categoriaPai: "Despesas fixas",
      tipo: 2,
      valor: 450,
      dataPagamento: "2026-10-22",
      favorecido: "Cia. Elétrica",
      documento: null,
      observacao: null,
      peloCaixa: true,
      cancelado: false,
      canceladoPor: null,
    });
  });

  it.each(["canceladoPor", "usuarioCancelamento", "nomeUsuarioCancelamento"])("lê quem cancelou do campo %s", (campo) => {
    expect(fromLancamentoResponse({ cancelado: true, [campo]: "Maria" })).toMatchObject({ cancelado: true, canceladoPor: "Maria" });
  });

  it("sem tipo na resposta, o tipo fica nulo; valor ausente é 0", () => {
    expect(fromLancamentoResponse({})).toMatchObject({ tipo: null, valor: 0, cancelado: false, peloCaixa: false, dataPagamento: "" });
    expect(fromLancamentoResponse({ tipoLancamento: 1 }).tipo).toBe(1);
  });
});

describe("fromCategoriaResponse", () => {
  it("lê a categoria; sem o campo ativo, vale como ativa", () => {
    expect(fromCategoriaResponse({ financeiroCategoriaId: 2, nome: "Aluguel", tipo: 2, financeiroCategoriaPaiId: 1, categoriaPai: "Despesas fixas", ativo: false })).toEqual({
      financeiroCategoriaId: 2,
      nome: "Aluguel",
      tipo: 2,
      financeiroCategoriaPaiId: 1,
      categoriaPai: "Despesas fixas",
      ativo: false,
    });
    expect(fromCategoriaResponse({ financeiroCategoriaId: 2, nome: "X", tipo: 1 }).ativo).toBe(true);
  });
});

describe("toLancamentoPayload", () => {
  it("converte os textos do formulário e leva opcionais vazios como null", () => {
    expect(toLancamentoPayload(formulario)).toEqual({
      financeiroCategoriaId: 7,
      descricao: "Conta de luz",
      valor: 1234.5,
      dataPagamento: "2026-10-22",
      formaPagamento: 2,
      favorecido: null,
      documento: "NF 1234",
      observacao: null,
      peloCaixa: false,
    });
  });

  it("data vazia vai como null (o back entende hoje)", () => {
    expect(toLancamentoPayload({ ...formulario, dataPagamento: "" }).dataPagamento).toBeNull();
  });

  it("no cadastro, peloCaixa vem do formulário", () => {
    expect(toLancamentoPayload({ ...formulario, formaPagamento: "1", peloCaixa: true }).peloCaixa).toBe(true);
  });

  it("na edição de lançamento comum, valor, data e forma vêm do formulário", () => {
    const comum = { ...atualPeloCaixa, peloCaixa: false };
    const payload = toLancamentoPayload(formulario, comum);

    expect(payload).toMatchObject({ valor: 1234.5, dataPagamento: "2026-10-22", formaPagamento: 2, peloCaixa: false });
  });

  it("na edição de lançamento feito pelo caixa, valor, data e forma saem do lançamento atual", () => {
    const payload = toLancamentoPayload(formulario, atualPeloCaixa);

    expect(payload).toMatchObject({
      valor: 100,
      dataPagamento: "2026-10-30",
      formaPagamento: 1,
      peloCaixa: true,
      // O que pode mudar continua vindo do formulário.
      descricao: "Conta de luz",
      financeiroCategoriaId: 7,
      documento: "NF 1234",
    });
  });
});

describe("toCategoriaPayload", () => {
  it("apara o nome e leva o pai vazio como null", () => {
    expect(toCategoriaPayload({ nome: "  Aluguel ", tipo: "2", financeiroCategoriaPaiId: "", ativo: false }, true)).toEqual({
      nome: "Aluguel",
      tipo: 2,
      financeiroCategoriaPaiId: null,
      ativo: true,
    });
  });

  it("na edição, ativo e pai vêm do formulário", () => {
    expect(toCategoriaPayload({ nome: "Energia", tipo: "2", financeiroCategoriaPaiId: "4", ativo: false })).toEqual({
      nome: "Energia",
      tipo: 2,
      financeiroCategoriaPaiId: 4,
      ativo: false,
    });
  });
});
