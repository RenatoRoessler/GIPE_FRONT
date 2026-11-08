import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/services/fatura", () => ({
  listFaturas: vi.fn(),
  getFatura: vi.fn(),
  emitirFatura: vi.fn(),
  pagarFatura: vi.fn(),
  cancelarFatura: vi.fn(),
}));

import { cancelarFatura, emitirFatura, getFatura, listFaturas, pagarFatura } from "@/lib/api/services/fatura";
import type { FaturaDetalhe, FaturaFiltros } from "@/types/fatura";
import { faturaKey, faturasKey } from "./queryKeys";
import { useFatura } from "./useFatura";
import { useFaturaMutations } from "./useFaturaMutations";
import { useFaturas } from "./useFaturas";

const filtros: FaturaFiltros = { empresaConveniadaId: null, situacao: null, pagina: 1 };

function novoCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function envolver(queryClient: QueryClient) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

// A lista e o detalhe já estão no cache: se a mutation os invalida, `isInvalidated` vira true.
function renderMutations() {
  const queryClient = novoCliente();
  queryClient.setQueryData(faturasKey(filtros), { items: [] });
  queryClient.setQueryData(faturaKey(12), { fatura: {}, itens: [] });
  const invalidada = (chave: readonly unknown[]) => queryClient.getQueryState(chave)?.isInvalidated ?? false;
  return { invalidada, ...renderHook(useFaturaMutations, { wrapper: envolver(queryClient) }) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useFaturas e useFatura", () => {
  it("useFaturas consulta a lista pelos filtros", async () => {
    vi.mocked(listFaturas).mockResolvedValue({ items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 });
    const { result } = renderHook(() => useFaturas(filtros), { wrapper: envolver(novoCliente()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listFaturas).toHaveBeenCalledWith(filtros);
  });

  it("useFatura consulta o detalhe pelo número", async () => {
    vi.mocked(getFatura).mockResolvedValue({ fatura: {}, itens: [] } as unknown as FaturaDetalhe);
    const { result } = renderHook(() => useFatura(12), { wrapper: envolver(novoCliente()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getFatura).toHaveBeenCalledWith(12);
  });
});

describe("useFaturaMutations", () => {
  it("emitir devolve o detalhe e atualiza lista e detalhe", async () => {
    const detalhe = { fatura: { convenioFaturaId: 12 }, itens: [] } as unknown as FaturaDetalhe;
    vi.mocked(emitirFatura).mockResolvedValue(detalhe);
    const { result, invalidada } = renderMutations();

    let resposta: FaturaDetalhe | undefined;
    await act(async () => {
      resposta = await result.current.emitir.mutateAsync({ empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "" });
    });

    expect(resposta).toBe(detalhe);
    expect(invalidada(faturasKey(filtros))).toBe(true);
    expect(invalidada(faturaKey(12))).toBe(true);
  });

  it("pagar chama o serviço com número, valores e hoje, e atualiza as consultas", async () => {
    vi.mocked(pagarFatura).mockResolvedValue(undefined);
    const { result, invalidada } = renderMutations();
    const values = { formaPagamento: "2", valorPago: "", dataPagamento: "" };

    await act(async () => {
      await result.current.pagar.mutateAsync({ id: 12, values, hoje: "2026-11-08" });
    });

    expect(pagarFatura).toHaveBeenCalledWith(12, values, "2026-11-08");
    expect(invalidada(faturaKey(12))).toBe(true);
  });

  it("cancelar chama o serviço e atualiza as consultas", async () => {
    vi.mocked(cancelarFatura).mockResolvedValue(undefined);
    const { result, invalidada } = renderMutations();

    await act(async () => {
      await result.current.cancelar.mutateAsync(12);
    });

    expect(cancelarFatura).toHaveBeenCalledWith(12);
    expect(invalidada(faturasKey(filtros))).toBe(true);
  });

  it("erro não invalida nada nem tenta de novo", async () => {
    vi.mocked(emitirFatura).mockRejectedValue(new Error("Não há saídas em aberto."));
    const { result, invalidada } = renderMutations();

    await act(async () => {
      await result.current.emitir.mutateAsync({ empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "" }).catch(() => undefined);
    });

    expect(emitirFatura).toHaveBeenCalledTimes(1);
    expect(invalidada(faturasKey(filtros))).toBe(false);
  });
});
