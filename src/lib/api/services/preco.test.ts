import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { getPreco, listAllPrecos, listPrecos, TAMANHO_PAGINA_CARGA } from "./preco";

const dto = (id: number, descricao = `Tabela ${id}`) => ({
  rotatividadeId: id,
  descricao,
  tipoRegra: 1,
  inicioVigencia: "2026-06-06T00:00:00",
  fimVigencia: null,
  ativo: true,
  regras: [],
  faixaValores: [],
  categorias: [{ tipoCategoria: 99 }],
});

function pagina(page: number, totalPages: number, ids: number[]) {
  return { data: { items: ids.map((id) => dto(id)), page, pageSize: TAMANHO_PAGINA_CARGA, totalRecords: 99, totalPages } };
}

// Responde a cada chamada pelo número da página pedida, mesmo fora de ordem.
function servir(paginas: Record<number, ReturnType<typeof pagina>>) {
  vi.mocked(api.get).mockImplementation(async (_url, config) => {
    const numero = (config?.params as { pagina: number }).pagina;
    const resposta = paginas[numero];
    if (!resposta) {
      throw new ApiError("server", "Erro no servidor.", 500);
    }
    return resposta;
  });
}

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

describe("listPrecos", () => {
  it("converte os itens da API para o modelo da tela", async () => {
    servir({ 1: pagina(1, 1, [7]) });
    const result = await listPrecos({ pagina: 1, tamanhoPagina: 20 });
    expect(api.get).toHaveBeenCalledWith("/rotatividade", { params: { pagina: 1, tamanhoPagina: 20 } });
    expect(result.items[0]).toMatchObject({ rotatividadeId: 7, categorias: [99] });
  });
});

describe("listAllPrecos", () => {
  it("com uma só página faz uma só chamada", async () => {
    servir({ 1: pagina(1, 1, [1, 2]) });
    const todas = await listAllPrecos();
    expect(todas.map((preco) => preco.rotatividadeId)).toEqual([1, 2]);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/rotatividade", { params: { pagina: 1, tamanhoPagina: TAMANHO_PAGINA_CARGA } });
  });

  it("sem registros devolve lista vazia", async () => {
    servir({ 1: { data: { items: [], page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 } } });
    expect(await listAllPrecos()).toEqual([]);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("percorre todas as páginas e mantém a ordem da API", async () => {
    servir({ 1: pagina(1, 3, [1, 2]), 2: pagina(2, 3, [3, 4]), 3: pagina(3, 3, [5]) });
    const todas = await listAllPrecos();
    expect(todas.map((preco) => preco.rotatividadeId)).toEqual([1, 2, 3, 4, 5]);
    expect(api.get).toHaveBeenCalledTimes(3);
  });

  it("falha numa página propaga o erro da API", async () => {
    servir({ 1: pagina(1, 3, [1]), 2: pagina(2, 3, [2]) });
    await expect(listAllPrecos()).rejects.toMatchObject({ kind: "server", status: 500 });
  });

  it("falha na primeira página propaga o erro", async () => {
    servir({});
    await expect(listAllPrecos()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getPreco", () => {
  it("acha a tabela na primeira página", async () => {
    servir({ 1: pagina(1, 1, [1, 2, 3]) });
    expect((await getPreco(2)).rotatividadeId).toBe(2);
  });

  it("acha a tabela em qualquer página", async () => {
    servir({ 1: pagina(1, 3, [1]), 2: pagina(2, 3, [2]), 3: pagina(3, 3, [3]) });
    expect((await getPreco(3)).rotatividadeId).toBe(3);
  });

  it("lança not_found quando a tabela não existe", async () => {
    servir({ 1: pagina(1, 2, [1]), 2: pagina(2, 2, [2]) });
    await expect(getPreco(99)).rejects.toMatchObject({
      kind: "not_found",
      status: 404,
      message: "Tabela de preço não encontrada.",
    });
  });

  it("propaga falhas de comunicação em vez de dizer que não existe", async () => {
    servir({});
    await expect(getPreco(1)).rejects.toMatchObject({ kind: "server" });
  });
});
