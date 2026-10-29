import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/services/veiculo", () => ({ listModelos: vi.fn() }));

import { listModelos } from "@/lib/api/services/veiculo";
import { useModelos } from "./useModelos";
import { useSugestoesModelo } from "./useSugestoesModelo";

const LISTA = [
  { modeloId: 1, nome: "Civic", categoria: 1 },
  { modeloId: 2, nome: "Gol", categoria: 1 },
];

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.mocked(listModelos).mockReset();
});

describe("useModelos / useSugestoesModelo", () => {
  it("consulta a lista uma única vez, mesmo com várias montagens e textos diferentes", async () => {
    vi.mocked(listModelos).mockResolvedValue(LISTA);
    const { wrapper } = setup();

    const a = renderHook(() => useModelos(), { wrapper });
    const b = renderHook(({ texto }) => useSugestoesModelo(texto), { wrapper, initialProps: { texto: "c" } });
    await waitFor(() => expect(b.result.current.carregando).toBe(false));
    b.rerender({ texto: "civ" });

    expect(b.result.current.sugestoes.map((m) => m.nome)).toEqual(["Civic"]);
    expect(a.result.current.data).toHaveLength(2);
    expect(listModelos).toHaveBeenCalledTimes(1);
    expect(vi.mocked(listModelos).mock.calls[0]).toHaveLength(1);
  });

  it("segue utilizável, sem sugestões, quando a consulta falha", async () => {
    vi.mocked(listModelos).mockRejectedValue(new Error("falhou"));
    const { wrapper } = setup();

    const { result } = renderHook(() => useSugestoesModelo("civ"), { wrapper });
    await waitFor(() => expect(listModelos).toHaveBeenCalled());

    expect(result.current.sugestoes).toEqual([]);
  });

  it("tenta de novo na próxima montagem depois de uma falha", async () => {
    vi.mocked(listModelos).mockRejectedValueOnce(new Error("falhou")).mockResolvedValue(LISTA);
    const { wrapper } = setup();

    const primeira = renderHook(() => useModelos(), { wrapper });
    await waitFor(() => expect(primeira.result.current.isError).toBe(true));
    primeira.unmount();

    const segunda = renderHook(() => useModelos(), { wrapper });
    await waitFor(() => expect(segunda.result.current.data).toHaveLength(2));
    expect(listModelos).toHaveBeenCalledTimes(2);
  });
});
