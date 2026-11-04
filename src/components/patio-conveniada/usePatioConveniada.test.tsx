import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { VeiculoConveniada } from "@/types/patioConveniada";

vi.mock("@/lib/api/services/patioConveniada", () => ({ listarPatioConveniada: vi.fn() }));

import { listarPatioConveniada } from "@/lib/api/services/patioConveniada";
import { PATIO_CONVENIADA_KEY } from "./patioConveniadaKeys";
import { usePatioConveniada } from "./usePatioConveniada";

const veiculo = { patioConvenioId: 12, placa: "OLG7Z94" } as VeiculoConveniada;

function renderar(placa?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, ...renderHook(({ valor }) => usePatioConveniada(valor), { wrapper, initialProps: { valor: placa } }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listarPatioConveniada).mockResolvedValue([veiculo]);
});

describe("usePatioConveniada", () => {
  it("lê a lista inteira quando não há placa", async () => {
    const { result } = renderar();
    await waitFor(() => expect(result.current.data).toEqual([veiculo]));
    expect(listarPatioConveniada).toHaveBeenCalledWith("");
  });

  it("guarda cada placa numa chave própria, sob a chave da lista", async () => {
    const { result, queryClient } = renderar("OLG7Z94");
    await waitFor(() => expect(result.current.data).toEqual([veiculo]));
    expect(listarPatioConveniada).toHaveBeenCalledWith("OLG7Z94");
    expect(queryClient.getQueryCache().find({ queryKey: [...PATIO_CONVENIADA_KEY, "OLG7Z94"] })).toBeDefined();
  });

  it("ao trocar a placa, mantém a lista anterior até a nova chegar", async () => {
    let concluir: (lista: VeiculoConveniada[]) => void = () => undefined;
    const { result, rerender } = renderar();
    await waitFor(() => expect(result.current.data).toEqual([veiculo]));

    vi.mocked(listarPatioConveniada).mockReturnValue(new Promise((resolve) => (concluir = resolve)));
    rerender({ valor: "OLG7Z94" });

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
    expect(result.current.data).toEqual([veiculo]);
    concluir([]);
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it("expõe o erro", async () => {
    vi.mocked(listarPatioConveniada).mockRejectedValue(new ApiError("server", "Falha.", 500));
    const { result } = renderar();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Falha.");
  });
});
