import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { cancelarFatura, emitirFatura, FATURAS_POR_PAGINA, getFatura, listFaturas, pagarFatura } from "./fatura";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

beforeEach(() => {
  vi.resetAllMocks();
});

const faturaDto = {
  convenioFaturaId: 1,
  empresaConveniadaId: 53,
  conveniada: "Auto Peças",
  quantidadeSaidas: 1,
  valorTotal: 1.5,
  vencimento: "2026-12-08T00:00:00",
  situacao: 1,
};

describe("fatura service: emitir", () => {
  it("envia o corpo e devolve a fatura com as saídas", async () => {
    post.mockResolvedValue({ data: { fatura: faturaDto, itens: [{ patioConvenioId: 17, placa: "ABC1D23" }] } });
    const detalhe = await emitirFatura({ empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "" });

    expect(post).toHaveBeenCalledWith("/Fatura", { empresaConveniadaId: 53, vencimento: "2026-12-08" });
    expect(detalhe.fatura.convenioFaturaId).toBe(1);
    expect(detalhe.itens[0].placa).toBe("ABC1D23");
  });

  it("propaga o erro do back", async () => {
    post.mockRejectedValue(new Error("Não há saídas em aberto."));

    await expect(emitirFatura({ empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "" })).rejects.toThrow("Não há saídas em aberto.");
  });
});

describe("fatura service: lista", () => {
  it("consulta só com a página e o tamanho quando não há filtros", async () => {
    get.mockResolvedValue({ data: { items: [faturaDto], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 } });
    const lista = await listFaturas({ empresaConveniadaId: null, situacao: null, pagina: 1 });

    expect(get).toHaveBeenCalledWith("/Fatura", { params: { pagina: 1, tamanhoPagina: FATURAS_POR_PAGINA } });
    expect(lista.items).toHaveLength(1);
    expect(lista.items[0].vencimento).toBe("2026-12-08");
    expect(lista.totalRecords).toBe(1);
  });

  it("leva conveniada e situação quando preenchidas", async () => {
    get.mockResolvedValue({ data: { items: [] } });
    const lista = await listFaturas({ empresaConveniadaId: 53, situacao: 2, pagina: 3 });

    expect(get).toHaveBeenCalledWith("/Fatura", { params: { empresaConveniadaId: 53, situacao: 2, pagina: 3, tamanhoPagina: 20 } });
    expect(lista).toEqual({ items: [], page: 3, pageSize: 20, totalRecords: 0, totalPages: 0 });
  });
});

describe("fatura service: detalhe", () => {
  it("busca pelo número da fatura", async () => {
    get.mockResolvedValue({ data: { fatura: faturaDto, itens: [] } });
    const detalhe = await getFatura(12);

    expect(get).toHaveBeenCalledWith("/Fatura/12");
    expect(detalhe.fatura.conveniada).toBe("Auto Peças");
  });
});

describe("fatura service: pagar e cancelar", () => {
  it("pagar envia o corpo mínimo por PUT", async () => {
    put.mockResolvedValue({ data: {} });
    await pagarFatura(12, { formaPagamento: "2", valorPago: "", dataPagamento: "" }, "2026-11-08");

    expect(put).toHaveBeenCalledWith("/Fatura/12/pagar", { formaPagamento: 2 });
  });

  it("cancelar não leva corpo", async () => {
    put.mockResolvedValue({ data: {} });
    await cancelarFatura(12);

    expect(put).toHaveBeenCalledWith("/Fatura/12/cancelar");
  });
});
