import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/services/financeiro", () => ({
  createLancamento: vi.fn(),
  updateLancamento: vi.fn(),
  cancelarLancamento: vi.fn(),
  createCategoria: vi.fn(),
  updateCategoria: vi.fn(),
}));

import { CAIXA_KEY } from "@/components/caixa/useCaixa";
import { cancelarLancamento, createCategoria, createLancamento, updateCategoria, updateLancamento } from "@/lib/api/services/financeiro";
import type { CategoriaFormValues, Lancamento, LancamentoFormValues } from "@/types/financeiro";
import { CATEGORIAS_KEY, lancamentosKey } from "./queryKeys";
import { useCategoriaMutations } from "./useCategoriaMutations";
import { useLancamentoMutations } from "./useLancamentoMutations";

const CHAVE_LISTA = lancamentosKey({ incluirCancelados: false, pagina: 1 });
const CHAVE_CAIXA = [...CAIXA_KEY, "turno"];

const formulario: LancamentoFormValues = {
  tipo: "2",
  financeiroCategoriaId: "7",
  descricao: "Conta de luz",
  valor: "450,00",
  dataPagamento: "2026-10-30",
  formaPagamento: "1",
  favorecido: "",
  documento: "",
  observacao: "",
  peloCaixa: false,
};

const lancamento = (peloCaixa: boolean) => ({ financeiroLancamentoId: 4, peloCaixa }) as Lancamento;

// A lista do financeiro e o turno do caixa já estão no cache: se o hook os invalida, `isInvalidated` vira true.
function renderHooks<T>(hook: () => T) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(CHAVE_LISTA, { items: [] });
  queryClient.setQueryData(CATEGORIAS_KEY, []);
  queryClient.setQueryData(CHAVE_CAIXA, { turnoId: 1 });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const invalidada = (chave: readonly unknown[]) => queryClient.getQueryState(chave)?.isInvalidated ?? false;
  return { invalidada, ...renderHook(hook, { wrapper }) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useLancamentoMutations", () => {
  it("criar um lançamento comum recarrega o financeiro e não o caixa", async () => {
    vi.mocked(createLancamento).mockResolvedValue();
    const { result, invalidada } = renderHooks(() => useLancamentoMutations());

    await act(() => result.current.criar.mutateAsync(formulario));

    expect(createLancamento).toHaveBeenCalledWith(formulario);
    expect(invalidada(CHAVE_LISTA)).toBe(true);
    expect(invalidada(CHAVE_CAIXA)).toBe(false);
  });

  it("criar um lançamento pelo caixa recarrega também o caixa", async () => {
    vi.mocked(createLancamento).mockResolvedValue();
    const { result, invalidada } = renderHooks(() => useLancamentoMutations());

    await act(() => result.current.criar.mutateAsync({ ...formulario, peloCaixa: true }));

    expect(invalidada(CHAVE_LISTA)).toBe(true);
    expect(invalidada(CHAVE_CAIXA)).toBe(true);
  });

  it("editar usa o lançamento atual; só o feito pelo caixa recarrega o caixa", async () => {
    vi.mocked(updateLancamento).mockResolvedValue();
    const { result, invalidada } = renderHooks(() => useLancamentoMutations());

    await act(() => result.current.editar.mutateAsync({ id: 4, values: formulario, atual: lancamento(false) }));
    expect(updateLancamento).toHaveBeenCalledWith(4, formulario, lancamento(false));
    expect(invalidada(CHAVE_LISTA)).toBe(true);
    expect(invalidada(CHAVE_CAIXA)).toBe(false);

    await act(() => result.current.editar.mutateAsync({ id: 4, values: formulario, atual: lancamento(true) }));
    expect(invalidada(CHAVE_CAIXA)).toBe(true);
  });

  it("cancelar um lançamento pelo caixa recarrega o caixa; um comum, não", async () => {
    vi.mocked(cancelarLancamento).mockResolvedValue();
    const { result, invalidada } = renderHooks(() => useLancamentoMutations());

    await act(() => result.current.cancelar.mutateAsync(lancamento(false)));
    expect(cancelarLancamento).toHaveBeenCalledWith(4);
    expect(invalidada(CHAVE_CAIXA)).toBe(false);

    await act(() => result.current.cancelar.mutateAsync(lancamento(true)));
    expect(invalidada(CHAVE_CAIXA)).toBe(true);
  });

  it("com erro do back, não invalida nada e expõe o erro", async () => {
    vi.mocked(createLancamento).mockRejectedValue(new Error("O caixa está fechado."));
    const { result, invalidada } = renderHooks(() => useLancamentoMutations());

    await act(async () => {
      await result.current.criar.mutateAsync(formulario).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.criar.error?.message).toBe("O caixa está fechado."));
    expect(invalidada(CHAVE_LISTA)).toBe(false);
  });
});

describe("useCategoriaMutations", () => {
  const valores: CategoriaFormValues = { nome: "Aluguel", tipo: "2", financeiroCategoriaPaiId: "", ativo: true };

  it("criar e editar recarregam todo o financeiro", async () => {
    vi.mocked(createCategoria).mockResolvedValue();
    vi.mocked(updateCategoria).mockResolvedValue();
    const { result, invalidada } = renderHooks(() => useCategoriaMutations());

    await act(() => result.current.criar.mutateAsync(valores));
    expect(createCategoria).toHaveBeenCalledWith(valores);
    expect(invalidada(CATEGORIAS_KEY)).toBe(true);
    expect(invalidada(CHAVE_LISTA)).toBe(true);

    await act(() => result.current.editar.mutateAsync({ id: 3, values: valores }));
    expect(updateCategoria).toHaveBeenCalledWith(3, valores);
  });

  it("não mexe no caixa", async () => {
    vi.mocked(createCategoria).mockResolvedValue();
    const { result, invalidada } = renderHooks(() => useCategoriaMutations());

    await act(() => result.current.criar.mutateAsync(valores));

    expect(invalidada(CHAVE_CAIXA)).toBe(false);
  });
});
