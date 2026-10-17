import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { PrecoView } from "@/types/preco";

vi.mock("@/lib/api/services/preco", () => ({ listAllPrecos: vi.fn() }));

import { listAllPrecos } from "@/lib/api/services/preco";
import { PRECOS_PAGE_SIZE, usePrecos, type UsePrecosEstado } from "./usePrecos";

function preco(id: number, extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: id,
    empresaConveniadaId: null,
    descricao: `Tabela ${id}`,
    tipoRegra: 1,
    inicioVigencia: "2020-01-01T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 0,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 0,
    valorAdicionalDiaria: 0,
    ativo: true,
    regras: [],
    faixas: [],
    categorias: [],
    ...extra,
  };
}

const lista = (n: number) => Array.from({ length: n }, (_, index) => preco(index + 1));
const SEM_FILTRO: UsePrecosEstado = { q: "", situacao: "todas", pagina: 1 };

function renderPrecos(estado: UsePrecosEstado = SEM_FILTRO) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(({ e }) => usePrecos(e), { wrapper, initialProps: { e: estado } });
}

function pronto(result: { current: ReturnType<typeof usePrecos> }) {
  if (result.current.status !== "pronto") {
    throw new Error(`esperava pronto, veio ${result.current.status}`);
  }
  return result.current;
}

beforeEach(() => {
  vi.mocked(listAllPrecos).mockReset();
});

describe("usePrecos", () => {
  it("começa carregando", async () => {
    let concluir: (value: PrecoView[]) => void = () => {};
    vi.mocked(listAllPrecos).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const { result } = renderPrecos();
    expect(result.current).toEqual({ status: "carregando" });
    concluir([]);
    await waitFor(() => expect(result.current.status).toBe("pronto"));
  });

  it("carrega tudo uma vez, sem refetch ao focar a janela", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue(lista(3));
    const { result } = renderPrecos();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    window.dispatchEvent(new Event("focus"));
    expect(listAllPrecos).toHaveBeenCalledTimes(1);
  });

  it("pagina em memória, 20 por página", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue(lista(45));
    const { result } = renderPrecos();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    const primeira = pronto(result);
    expect(PRECOS_PAGE_SIZE).toBe(20);
    expect(primeira.pagina).toMatchObject({ page: 1, totalPages: 3, totalRecords: 45, pageSize: 20 });
    expect(primeira.pagina.itens.map((item) => item.rotatividadeId)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(primeira.todas).toHaveLength(45);
  });

  it("entrega a página pedida", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue(lista(45));
    const { result } = renderPrecos({ ...SEM_FILTRO, pagina: 3 });
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    const terceira = pronto(result);
    expect(terceira.pagina.page).toBe(3);
    expect(terceira.pagina.itens.map((item) => item.rotatividadeId)).toEqual([41, 42, 43, 44, 45]);
    expect(terceira.paginaForaDoIntervalo).toBe(false);
  });

  it("página fora do intervalo cai na última e avisa", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue(lista(45));
    const { result } = renderPrecos({ ...SEM_FILTRO, pagina: 9 });
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    const ajustada = pronto(result);
    expect(ajustada.pagina.page).toBe(3);
    expect(ajustada.paginaForaDoIntervalo).toBe(true);
  });

  it("lista vazia tem uma página sem itens", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue([]);
    const { result } = renderPrecos();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    expect(pronto(result)).toMatchObject({
      pagina: { itens: [], page: 1, totalPages: 1, totalRecords: 0 },
      contagem: "0 tabelas",
      paginaForaDoIntervalo: false,
    });
  });

  it("busca na descrição e a paginação passa a valer sobre o resultado", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue([...lista(30), preco(99, { descricao: "Black Friday" })]);
    const { result } = renderPrecos({ q: "black", situacao: "todas", pagina: 1 });
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    const achada = pronto(result);
    expect(achada.filtradas.map((item) => item.rotatividadeId)).toEqual([99]);
    expect(achada.pagina).toMatchObject({ page: 1, totalPages: 1, totalRecords: 1 });
    expect(achada.contagem).toBe("1 tabela");
    expect(achada.todas).toHaveLength(31);
  });

  it("filtra por situação e conta no singular e no plural", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue([
      preco(1),
      preco(2),
      preco(3, { ativo: false }),
    ]);
    const { result } = renderPrecos({ q: "", situacao: "vigente", pagina: 1 });
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    expect(pronto(result).contagem).toBe("2 vigentes");

    const inativas = renderPrecos({ q: "", situacao: "inativa", pagina: 1 });
    await waitFor(() => expect(inativas.result.current.status).toBe("pronto"));
    expect(pronto(inativas.result).contagem).toBe("1 inativa");
  });

  it("combina busca e situação", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue([
      preco(1, { descricao: "Tarifa padrão" }),
      preco(2, { descricao: "Tarifa noturna", ativo: false }),
    ]);
    const { result } = renderPrecos({ q: "tarifa", situacao: "inativa", pagina: 1 });
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    expect(pronto(result).filtradas.map((item) => item.rotatividadeId)).toEqual([2]);
  });

  it("mudar a busca reaproveita a carga, sem nova chamada", async () => {
    vi.mocked(listAllPrecos).mockResolvedValue([preco(1, { descricao: "Motos" }), preco(2, { descricao: "Carros" })]);
    const { result, rerender } = renderPrecos();
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    rerender({ e: { q: "moto", situacao: "todas", pagina: 1 } });
    expect(pronto(result).filtradas.map((item) => item.rotatividadeId)).toEqual([1]);
    expect(listAllPrecos).toHaveBeenCalledTimes(1);
  });

  it("falha na carga devolve o erro e permite tentar de novo", async () => {
    vi.mocked(listAllPrecos).mockRejectedValueOnce(new ApiError("network"));
    const { result } = renderPrecos();
    await waitFor(() => expect(result.current.status).toBe("erro"));
    if (result.current.status === "erro") {
      expect(result.current.erro).toBe("Não foi possível conectar ao servidor.");
    }

    vi.mocked(listAllPrecos).mockResolvedValue(lista(2));
    if (result.current.status === "erro") {
      result.current.refetch();
    }
    await waitFor(() => expect(result.current.status).toBe("pronto"));
    expect(listAllPrecos).toHaveBeenCalledTimes(2);
  });
});
