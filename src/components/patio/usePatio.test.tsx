import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { PatioVeiculo } from "@/types/patio";

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn() }));

import { listPatio } from "@/lib/api/services/patio";
import { PATIO_QUERY_KEY } from "./patioKeys";
import { PATIO_ATUALIZACAO_MS, usePatio, type UsePatioOptions } from "./usePatio";

const veiculo: PatioVeiculo = {
  patioId: 1,
  placa: "ABC1D23",
  categoria: 2,
  modelo: "Gol",
  cor: "PRATA",
  codigoTicket: null,
  sequencial: 10,
  mensalista: false,
  dataHoraEntrada: "2026-10-20T16:41:52",
  minutosPermanencia: 60,
  permanencia: "1h 0min",
  rotatividadeDescricao: null,
  usuarioEntrada: null,
  token: null,
};

function renderPatio(options: UsePatioOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook((props: UsePatioOptions) => usePatio(props), { wrapper, initialProps: options }) };
}

describe("usePatio", () => {
  beforeEach(() => {
    vi.mocked(listPatio).mockReset().mockResolvedValue([veiculo]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa a chave do pátio e carrega a lista", async () => {
    const { result, queryClient } = renderPatio();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([veiculo]);
    expect(queryClient.getQueryData(PATIO_QUERY_KEY)).toEqual([veiculo]);
  });

  it("recarrega sozinho a cada 60 segundos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = renderPatio();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listPatio).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PATIO_ATUALIZACAO_MS + 100);
    });
    expect(listPatio).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PATIO_ATUALIZACAO_MS);
    });
    expect(listPatio).toHaveBeenCalledTimes(3);
  });

  it("não recarrega sozinho enquanto está pausado, e volta quando a pausa acaba", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result, rerender } = renderPatio({ pausado: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PATIO_ATUALIZACAO_MS * 3);
    });
    expect(listPatio).toHaveBeenCalledTimes(1);

    rerender({ pausado: false });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PATIO_ATUALIZACAO_MS + 100);
    });
    expect(listPatio).toHaveBeenCalledTimes(2);
  });

  it("invalidar a chave do pátio recarrega a lista", async () => {
    const { result, queryClient } = renderPatio();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // O React Query só avisa de mudanças nas propriedades lidas: ler `data` antes faz o hook acompanhá-la.
    expect(result.current.data).toHaveLength(1);
    vi.mocked(listPatio).mockResolvedValue([veiculo, { ...veiculo, patioId: 2, placa: "XYZ9K88" }]);

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY });
    });

    await waitFor(() => expect(result.current.data).toHaveLength(2));
  });

  it("o erro da API chega ao hook", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    const { result } = renderPatio();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: "forbidden" });
  });
});
