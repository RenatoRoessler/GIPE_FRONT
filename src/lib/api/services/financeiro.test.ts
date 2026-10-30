import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import {
  cancelarLancamento,
  createCategoria,
  createLancamento,
  getFluxo,
  getLancamento,
  listCategorias,
  listLancamentos,
  updateCategoria,
  updateLancamento,
} from "./financeiro";
import type { Lancamento, LancamentoFormValues } from "@/types/financeiro";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

beforeEach(() => {
  vi.resetAllMocks();
});

const formulario: LancamentoFormValues = {
  tipo: "2",
  financeiroCategoriaId: "7",
  descricao: "Conta de luz",
  valor: "450,00",
  dataPagamento: "2026-10-22",
  formaPagamento: "1",
  favorecido: "",
  documento: "",
  observacao: "",
  peloCaixa: true,
};

describe("financeiro service: fluxo", () => {
  it("consulta com as datas em AAAA-MM-DD e o agrupamento", async () => {
    get.mockResolvedValue({ data: { totalEntradas: 10, periodos: [], categorias: [] } });
    const fluxo = await getFluxo({ dataInicio: "2026-10-01", dataFim: "2026-10-31", agrupamento: 1 });

    expect(get).toHaveBeenCalledWith("/Financeiro/fluxo", { params: { dataInicio: "2026-10-01", dataFim: "2026-10-31", agrupamento: 1 } });
    expect(fluxo.totalEntradas).toBe(10);
  });
});

describe("financeiro service: lançamentos", () => {
  it("lista só com os filtros preenchidos", async () => {
    get.mockResolvedValue({ data: { items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 } });

    await listLancamentos({ incluirCancelados: false, pagina: 1 });
    expect(get).toHaveBeenLastCalledWith("/Financeiro/lancamento", { params: { pagina: 1, tamanhoPagina: 20 } });

    await listLancamentos({ de: "2026-10-01", ate: "2026-10-31", tipo: 2, financeiroCategoriaId: 7, incluirCancelados: true, pagina: 3 });
    expect(get).toHaveBeenLastCalledWith("/Financeiro/lancamento", {
      params: { dataInicio: "2026-10-01", dataFim: "2026-10-31", tipo: 2, financeiroCategoriaId: 7, incluirCancelados: true, pagina: 3, tamanhoPagina: 20 },
    });
  });

  it("mapeia os itens e completa a paginação que o back não mandar", async () => {
    get.mockResolvedValue({ data: { items: [{ financeiroLancamentoId: 1, valor: 10, tipo: 1 }] } });
    const pagina = await listLancamentos({ incluirCancelados: false, pagina: 2 });

    expect(pagina.items[0]).toMatchObject({ financeiroLancamentoId: 1, valor: 10, tipo: 1 });
    expect(pagina).toMatchObject({ page: 2, pageSize: 20, totalRecords: 0, totalPages: 0 });
  });

  it("busca um lançamento pelo id", async () => {
    get.mockResolvedValue({ data: { financeiroLancamentoId: 5, descricao: "Aluguel" } });
    expect((await getLancamento(5)).descricao).toBe("Aluguel");
    expect(get).toHaveBeenCalledWith("/Financeiro/lancamento/5");
  });

  it("cadastra com o corpo convertido", async () => {
    post.mockResolvedValue({ data: {} });
    await createLancamento(formulario);

    expect(post).toHaveBeenCalledWith("/Financeiro/lancamento", {
      financeiroCategoriaId: 7,
      descricao: "Conta de luz",
      valor: 450,
      dataPagamento: "2026-10-22",
      formaPagamento: 1,
      favorecido: null,
      documento: null,
      observacao: null,
      peloCaixa: true,
    });
  });

  it("edita lançamento feito pelo caixa reenviando valor, data e forma atuais", async () => {
    put.mockResolvedValue({ data: {} });
    const atual = { financeiroLancamentoId: 9, valor: 100, dataPagamento: "2026-10-30", formaPagamento: 1, peloCaixa: true } as Lancamento;
    await updateLancamento(9, { ...formulario, valor: "999,00", dataPagamento: "2026-01-01", formaPagamento: "2" }, atual);

    expect(put).toHaveBeenCalledWith("/Financeiro/lancamento/9", expect.objectContaining({ valor: 100, dataPagamento: "2026-10-30", formaPagamento: 1 }));
  });

  it("cancela com PUT em /cancelar, sem corpo", async () => {
    put.mockResolvedValue({ data: {} });
    await cancelarLancamento(4);

    expect(put).toHaveBeenCalledWith("/Financeiro/lancamento/4/cancelar");
  });
});

describe("financeiro service: categorias", () => {
  it("lista e mapeia as categorias", async () => {
    get.mockResolvedValue({ data: [{ financeiroCategoriaId: 1, nome: "Despesas fixas", tipo: 2, ativo: true }] });
    const categorias = await listCategorias();

    expect(get).toHaveBeenCalledWith("/Financeiro/categoria");
    expect(categorias).toEqual([{ financeiroCategoriaId: 1, nome: "Despesas fixas", tipo: 2, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true }]);
  });

  it("lista vazia quando o back não manda lista", async () => {
    get.mockResolvedValue({ data: null });
    expect(await listCategorias()).toEqual([]);
  });

  it("cria sempre ativa e edita com o ativo do formulário", async () => {
    post.mockResolvedValue({ data: {} });
    put.mockResolvedValue({ data: {} });
    const valores = { nome: "Aluguel", tipo: "2", financeiroCategoriaPaiId: "1", ativo: false };

    await createCategoria(valores);
    expect(post).toHaveBeenCalledWith("/Financeiro/categoria", { nome: "Aluguel", tipo: 2, financeiroCategoriaPaiId: 1, ativo: true });

    await updateCategoria(3, valores);
    expect(put).toHaveBeenCalledWith("/Financeiro/categoria/3", { nome: "Aluguel", tipo: 2, financeiroCategoriaPaiId: 1, ativo: false });
  });
});
