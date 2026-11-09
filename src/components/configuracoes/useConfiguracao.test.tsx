import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const servico = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => servico);

import { useConfiguracao, useSalvarConfiguracao } from "./useConfiguracao";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const GRAVADA = { modelo: false, cor: true, prisma: true, alteradoPorId: 48, alteradoEm: "2026-11-08T16:36:03" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useConfiguracao", () => {
  it("enquanto carrega vale o padrão da empresa", () => {
    servico.getConfiguracao.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useConfiguracao(), { wrapper });
    expect(result.current.carregando).toBe(true);
    expect(result.current.carregada).toBe(false);
    expect(result.current.configuracao).toMatchObject({ modelo: true, cor: true, prisma: false });
  });

  it("devolve a configuração do servidor", async () => {
    servico.getConfiguracao.mockResolvedValue(GRAVADA);
    const { result } = renderHook(() => useConfiguracao(), { wrapper });
    await waitFor(() => expect(result.current.carregada).toBe(true));
    expect(result.current.configuracao).toEqual(GRAVADA);
  });

  it("se falhar, segue com o padrão e expõe o erro", async () => {
    servico.getConfiguracao.mockRejectedValue(new ApiError("network"));
    const { result } = renderHook(() => useConfiguracao(), { wrapper });
    await waitFor(() => expect(result.current.erro).toBeInstanceOf(ApiError));
    expect(result.current.carregada).toBe(false);
    expect(result.current.configuracao).toMatchObject({ modelo: true, cor: true, prisma: false });
  });
});

describe("useSalvarConfiguracao", () => {
  it("grava com o PUT", async () => {
    servico.updateConfiguracao.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSalvarConfiguracao(), { wrapper });
    await act(async () => result.current.mutateAsync({ modelo: true, cor: true, prisma: true }));
    expect(servico.updateConfiguracao).toHaveBeenCalledWith({ modelo: true, cor: true, prisma: true });
  });

  it("propaga o ApiError", async () => {
    servico.updateConfiguracao.mockRejectedValue(new ApiError("forbidden"));
    const { result } = renderHook(() => useSalvarConfiguracao(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ modelo: true, cor: true, prisma: false })).rejects.toBeInstanceOf(ApiError);
    });
  });
});
