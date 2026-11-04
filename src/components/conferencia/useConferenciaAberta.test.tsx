import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conferenciaAberta, resumoComUltima } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse, fromResumoResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { ApiError } from "@/lib/api/errors";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({ obterAberta: vi.fn(), obterResumo: vi.fn() }));

import { obterAberta, obterResumo } from "@/lib/api/services/conferenciaPatio";
import { conferenciaAbertaKey, conferenciaResumoKey } from "./conferenciaKeys";
import { CONFERENCIA_ATUALIZACAO_MS, useConferenciaAberta, type UseConferenciaAbertaOptions } from "./useConferenciaAberta";
import { useConferenciaResumo } from "./useConferenciaResumo";

const conferencia = fromConferenciaResponse(conferenciaAberta);
const resumo = fromResumoResponse(resumoComUltima);

function wrapperComCliente() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, wrapper };
}

describe("useConferenciaAberta", () => {
  beforeEach(() => {
    vi.mocked(obterAberta).mockReset().mockResolvedValue(conferencia);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function render(options: UseConferenciaAbertaOptions = {}) {
    const { queryClient, wrapper } = wrapperComCliente();
    return { queryClient, ...renderHook((props: UseConferenciaAbertaOptions) => useConferenciaAberta(props), { wrapper, initialProps: options }) };
  }

  it("usa a chave da conferência aberta e carrega", async () => {
    const { result, queryClient } = render();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(conferencia);
    expect(queryClient.getQueryData(conferenciaAbertaKey)).toEqual(conferencia);
  });

  it("sem conferência em andamento, devolve nulo", async () => {
    vi.mocked(obterAberta).mockResolvedValue(null);
    const { result } = render();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("recarrega a cada 30 segundos quando ativo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = render({ ativo: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(obterAberta).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONFERENCIA_ATUALIZACAO_MS + 100);
    });
    expect(obterAberta).toHaveBeenCalledTimes(2);
  });

  it("não recarrega sozinho quando inativo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = render({ ativo: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONFERENCIA_ATUALIZACAO_MS * 3);
    });
    expect(obterAberta).toHaveBeenCalledTimes(1);
  });

  it("expõe o erro da API", async () => {
    vi.mocked(obterAberta).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    const { result } = render();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: "forbidden" });
  });
});

describe("useConferenciaResumo", () => {
  beforeEach(() => {
    vi.mocked(obterResumo).mockReset().mockResolvedValue(resumo);
  });

  it("usa a chave do resumo e expõe caixa, última conferência e a em andamento", async () => {
    const { queryClient, wrapper } = wrapperComCliente();
    const { result } = renderHook(() => useConferenciaResumo(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ caixaIdAberto: 4, ultimaConferencia: { patioConferenciaId: 1 }, conferenciaAberta: null });
    expect(queryClient.getQueryData(conferenciaResumoKey)).toEqual(resumo);
  });
});
