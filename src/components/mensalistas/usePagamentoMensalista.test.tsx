import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { PagamentoMensalistaResultado } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({ pagarMensalista: vi.fn() }));

import { pagarMensalista } from "@/lib/api/services/mensalista";
import { contratoQueryKey } from "./useContratosMensalistas";
import { usePagamentoMensalista, type UsePagamentoMensalistaOptions } from "./usePagamentoMensalista";
import { MENSALISTAS_QUERY_KEY } from "./useTiposMensalidade";

const values = { mensalistaId: 7, valorPago: 280, formaPagamento: 2 };
const CHAVE_LISTA = [...MENSALISTAS_QUERY_KEY, { pagina: 1 }];

const resultado: PagamentoMensalistaResultado = {
  paga: { cobrancaId: 1, valor: 280, vencimento: "2026-10-05", dataPagamento: null, formaPagamento: 2, status: 1 },
  proxima: { cobrancaId: 2, valor: 280, vencimento: "2026-11-05", dataPagamento: null, formaPagamento: null, status: 0 },
};

// A lista e o contrato do id 7 já estão no cache: se o hook os invalida, `isInvalidated` vira true.
// O contrato está sob o mesmo prefixo da lista, então invalidar o prefixo invalida os dois.
function renderPagamento(options: UsePagamentoMensalistaOptions = {}) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(CHAVE_LISTA, { items: [] });
  queryClient.setQueryData(contratoQueryKey(7), { status: 1 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const listaInvalidada = () => queryClient.getQueryState(CHAVE_LISTA)?.isInvalidated ?? false;
  const contratoInvalidado = () => queryClient.getQueryState(contratoQueryKey(7))?.isInvalidated ?? false;
  return { listaInvalidada, contratoInvalidado, ...renderHook(() => usePagamentoMensalista(options), { wrapper }) };
}

describe("usePagamentoMensalista", () => {
  beforeEach(() => {
    vi.mocked(pagarMensalista).mockReset();
  });

  it("no sucesso invalida o prefixo dos mensalistas, devolve o resultado e avisa", async () => {
    vi.mocked(pagarMensalista).mockResolvedValue(resultado);
    const onSuccess = vi.fn();
    const { result, listaInvalidada, contratoInvalidado } = renderPagamento({ onSuccess });

    act(() => result.current.pagar(values));
    await waitFor(() => expect(result.current.resultado).toEqual(resultado));

    expect(pagarMensalista).toHaveBeenCalledWith(values);
    expect(onSuccess).toHaveBeenCalledWith(resultado);
    expect(listaInvalidada()).toBe(true);
    expect(contratoInvalidado()).toBe(true);
    expect(result.current.erro).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it("dois cliques no mesmo tick geram uma única chamada", async () => {
    let concluir: (value: PagamentoMensalistaResultado) => void = () => {};
    vi.mocked(pagarMensalista).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    const { result } = renderPagamento();

    act(() => {
      result.current.pagar(values);
      result.current.pagar(values);
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    act(() => result.current.pagar(values));
    expect(pagarMensalista).toHaveBeenCalledTimes(1);

    concluir(resultado);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("libera um novo envio depois de um erro, mas nunca repete sozinho", async () => {
    vi.mocked(pagarMensalista).mockRejectedValueOnce(new ApiError("network")).mockResolvedValueOnce(resultado);
    const { result } = renderPagamento();

    act(() => result.current.pagar(values));
    await waitFor(() => expect(result.current.erro?.kind).toBe("rede"));
    expect(pagarMensalista).toHaveBeenCalledTimes(1);

    act(() => result.current.pagar(values));
    await waitFor(() => expect(result.current.resultado).toEqual(resultado));
    expect(pagarMensalista).toHaveBeenCalledTimes(2);
  });

  it("erro de contrato não aceito invalida o contrato do mensalista", async () => {
    vi.mocked(pagarMensalista).mockRejectedValue(new ApiError("validation", "O contrato ainda não foi aceito.", 400));
    const { result, contratoInvalidado } = renderPagamento();

    act(() => result.current.pagar(values));
    await waitFor(() => expect(result.current.erro?.kind).toBe("contrato-nao-aceito"));

    await waitFor(() => expect(contratoInvalidado()).toBe(true));
    expect(result.current.resultado).toBeNull();
  });

  it("erro genérico não invalida nada e traz a mensagem do back", async () => {
    vi.mocked(pagarMensalista).mockRejectedValue(new ApiError("validation", "Valor inválido.", 400));
    const { result, listaInvalidada, contratoInvalidado } = renderPagamento();

    act(() => result.current.pagar(values));
    await waitFor(() => expect(result.current.erro).toEqual({ kind: "generico", message: "Valor inválido." }));

    expect(listaInvalidada()).toBe(false);
    expect(contratoInvalidado()).toBe(false);
  });

  it("reset limpa o erro para voltar ao formulário", async () => {
    vi.mocked(pagarMensalista).mockRejectedValue(new ApiError("validation", "Valor inválido.", 400));
    const { result } = renderPagamento();

    act(() => result.current.pagar(values));
    await waitFor(() => expect(result.current.erro).not.toBeNull());
    act(() => result.current.reset());
    await waitFor(() => expect(result.current.erro).toBeNull());
  });
});
