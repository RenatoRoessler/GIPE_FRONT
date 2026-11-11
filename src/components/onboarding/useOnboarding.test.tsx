import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const servico = vi.hoisted(() => ({ getOnboarding: vi.fn(), marcarOnboardingVisualizado: vi.fn() }));
vi.mock("@/lib/api/services/onboarding", () => servico);

const usuario = vi.hoisted(() => ({ atual: { user: { id: "1" } as { id: string } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => usuario.atual }));

import { ONBOARDING_QUERY_KEY, useMarcarVisualizado, useOnboarding } from "./useOnboarding";

let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  usuario.atual = { user: { id: "1" }, isLoading: false };
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
});

describe("useOnboarding", () => {
  it("sem usuário conhecido não consulta", () => {
    usuario.atual = { user: null, isLoading: true };
    renderHook(() => useOnboarding(), { wrapper });
    expect(servico.getOnboarding).not.toHaveBeenCalled();
  });

  it("devolve o que o back diz", async () => {
    servico.getOnboarding.mockResolvedValue({ visualizado: false, dataVisualizacao: null });
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ visualizado: false, dataVisualizacao: null }));
  });

  it("se a consulta falhar, expõe o erro sem tentar de novo", async () => {
    servico.getOnboarding.mockRejectedValue(new ApiError("network"));
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(servico.getOnboarding).toHaveBeenCalledTimes(1);
  });
});

describe("useMarcarVisualizado", () => {
  it("registra e grava o resultado no cache, sem nova consulta", async () => {
    servico.marcarOnboardingVisualizado.mockResolvedValue(undefined);
    const { result } = renderHook(() => useMarcarVisualizado(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(client.getQueryData(ONBOARDING_QUERY_KEY)).toMatchObject({ visualizado: true });
    expect(servico.getOnboarding).not.toHaveBeenCalled();
  });

  it("se o registro falhar, o cache não muda", async () => {
    servico.marcarOnboardingVisualizado.mockRejectedValue(new ApiError("server"));
    client.setQueryData(ONBOARDING_QUERY_KEY, { visualizado: false, dataVisualizacao: null });
    const { result } = renderHook(() => useMarcarVisualizado(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync().catch(() => undefined);
    });

    expect(client.getQueryData(ONBOARDING_QUERY_KEY)).toEqual({ visualizado: false, dataVisualizacao: null });
  });
});
