import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";

vi.mock("../client", () => ({ api: { get: vi.fn() } }));

import { api } from "../client";
import { AGENDA_MAX_PAGES, AGENDA_PAGE_SIZE, listAllMensalistas } from "./mensalista";

// Resposta da API para a página `pagina` de `total` cadastros, `tamanho` por página.
function pagina(numero: number, total: number, tamanho: number) {
  const totalPages = Math.ceil(total / tamanho);
  const inicio = (numero - 1) * tamanho;
  const quantos = Math.max(0, Math.min(tamanho, total - inicio));
  return {
    items: Array.from({ length: quantos }, (_, i) => ({ mensalistaId: inicio + i + 1, nome: `M${inicio + i + 1}`, veiculos: [] })),
    page: numero,
    pageSize: tamanho,
    totalRecords: total,
    totalPages,
  };
}

function responder(total: number, tamanho: number) {
  vi.mocked(api.get).mockImplementation(async (_url, config) => {
    const params = (config as { params: { pagina: number } }).params;
    return { data: pagina(params.pagina, total, tamanho) };
  });
}

const paginasPedidas = () => vi.mocked(api.get).mock.calls.map(([, config]) => (config as { params: { pagina: number } }).params.pagina);

describe("listAllMensalistas", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("usa uma única chamada quando cabe em uma página", async () => {
    responder(37, 100);

    const resultado = await listAllMensalistas();

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/Mensalista", { params: { pagina: 1, tamanhoPagina: AGENDA_PAGE_SIZE } });
    expect(resultado.items).toHaveLength(37);
    expect(resultado).toMatchObject({ totalRecords: 37, truncado: false });
  });

  it("junta as páginas na ordem, mesmo que cheguem fora de ordem", async () => {
    vi.mocked(api.get).mockImplementation(async (_url, config) => {
      const { pagina: numero } = (config as { params: { pagina: number } }).params;
      // A página 2 demora mais que a 3.
      await new Promise((resolve) => setTimeout(resolve, numero === 2 ? 20 : 0));
      return { data: pagina(numero, 250, 100) };
    });

    const resultado = await listAllMensalistas();

    expect(paginasPedidas().sort()).toEqual([1, 2, 3]);
    expect(resultado.items.map((m) => m.mensalistaId)).toEqual(Array.from({ length: 250 }, (_, i) => i + 1));
    expect(resultado.truncado).toBe(false);
  });

  it("usa o pageSize devolvido pela API nas páginas seguintes", async () => {
    // Pedimos 100, mas a API só entrega 50 por página.
    responder(120, 50);

    const resultado = await listAllMensalistas();

    expect(resultado.items).toHaveLength(120);
    expect(vi.mocked(api.get).mock.calls.map(([, config]) => (config as { params: { tamanhoPagina: number } }).params.tamanhoPagina)).toEqual([100, 50, 50]);
  });

  it("para em maxPaginas e avisa que cortou", async () => {
    responder(1500, 100);

    const resultado = await listAllMensalistas();

    expect(paginasPedidas()).toHaveLength(AGENDA_MAX_PAGES);
    expect(resultado.items).toHaveLength(AGENDA_MAX_PAGES * 100);
    expect(resultado).toMatchObject({ totalRecords: 1500, truncado: true });
  });

  it("aceita outro limite de páginas", async () => {
    responder(500, 100);

    const resultado = await listAllMensalistas({ maxPaginas: 2 });

    expect(resultado.items).toHaveLength(200);
    expect(resultado.truncado).toBe(true);
  });

  it("sem cadastros devolve a lista vazia", async () => {
    responder(0, 100);

    expect(await listAllMensalistas()).toMatchObject({ items: [], totalRecords: 0, truncado: false });
  });

  it("um erro em qualquer página rejeita tudo", async () => {
    vi.mocked(api.get).mockImplementation(async (_url, config) => {
      const { pagina: numero } = (config as { params: { pagina: number } }).params;
      if (numero === 3) {
        throw new ApiError("server", undefined, 500);
      }
      return { data: pagina(numero, 300, 100) };
    });

    await expect(listAllMensalistas()).rejects.toMatchObject({ kind: "server" });
  });
});
