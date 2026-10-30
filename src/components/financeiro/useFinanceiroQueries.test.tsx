import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/services/financeiro", () => ({
  getFluxo: vi.fn(),
  listLancamentos: vi.fn(),
  getLancamento: vi.fn(),
  listCategorias: vi.fn(),
}));

import { getFluxo, getLancamento, listCategorias, listLancamentos } from "@/lib/api/services/financeiro";
import { AGRUPAMENTO_FLUXO } from "@/types/financeiro";
import { CATEGORIAS_KEY, fluxoKey, lancamentoKey, lancamentosKey } from "./queryKeys";
import { useCategorias } from "./useCategorias";
import { useFluxo } from "./useFluxo";
import { useLancamento } from "./useLancamento";
import { useLancamentos } from "./useLancamentos";

function renderComCliente<T>(hook: () => T) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, ...renderHook(hook, { wrapper }) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("chaves de cache", () => {
  it("ficam todas sob o prefixo [financeiro]", () => {
    const params = { dataInicio: "2026-10-01", dataFim: "2026-10-31", agrupamento: AGRUPAMENTO_FLUXO.Dia };
    for (const chave of [CATEGORIAS_KEY, fluxoKey(params), lancamentosKey({ incluirCancelados: false, pagina: 1 }), lancamentoKey(3)]) {
      expect(chave[0]).toBe("financeiro");
    }
  });

  it("períodos e filtros diferentes têm chaves diferentes", () => {
    const base = { dataInicio: "2026-10-01", dataFim: "2026-10-31", agrupamento: AGRUPAMENTO_FLUXO.Dia };
    expect(fluxoKey(base)).not.toEqual(fluxoKey({ ...base, agrupamento: AGRUPAMENTO_FLUXO.Mes }));
    expect(lancamentosKey({ incluirCancelados: false, pagina: 1 })).not.toEqual(lancamentosKey({ incluirCancelados: true, pagina: 1 }));
  });
});

describe("useFluxo", () => {
  const params = { dataInicio: "2026-10-01", dataFim: "2026-10-31", agrupamento: AGRUPAMENTO_FLUXO.Dia };

  it("busca o fluxo com os parâmetros", async () => {
    vi.mocked(getFluxo).mockResolvedValue({ saldo: 10 } as Awaited<ReturnType<typeof getFluxo>>);
    const { result } = renderComCliente(() => useFluxo(params));

    await waitFor(() => expect(result.current.data?.saldo).toBe(10));
    expect(getFluxo).toHaveBeenCalledWith(params);
  });

  it("desabilitado, não busca nada", () => {
    renderComCliente(() => useFluxo(params, { enabled: false }));

    expect(getFluxo).not.toHaveBeenCalled();
  });
});

describe("useLancamentos", () => {
  it("busca a página com os filtros", async () => {
    const filtros = { incluirCancelados: true, pagina: 2 };
    vi.mocked(listLancamentos).mockResolvedValue({ items: [], page: 2, pageSize: 20, totalRecords: 0, totalPages: 0 });
    const { result } = renderComCliente(() => useLancamentos(filtros));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listLancamentos).toHaveBeenCalledWith(filtros);
  });
});

describe("useLancamento", () => {
  it("sem id, não busca", () => {
    renderComCliente(() => useLancamento(null));

    expect(getLancamento).not.toHaveBeenCalled();
  });

  it("com id, busca o lançamento no back", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ financeiroLancamentoId: 5 } as Awaited<ReturnType<typeof getLancamento>>);
    const { result } = renderComCliente(() => useLancamento(5));

    await waitFor(() => expect(result.current.data?.financeiroLancamentoId).toBe(5));
    expect(getLancamento).toHaveBeenCalledWith(5);
  });
});

describe("useCategorias", () => {
  it("busca todas as categorias", async () => {
    vi.mocked(listCategorias).mockResolvedValue([]);
    const { result } = renderComCliente(() => useCategorias());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCategorias).toHaveBeenCalledTimes(1);
  });
});
