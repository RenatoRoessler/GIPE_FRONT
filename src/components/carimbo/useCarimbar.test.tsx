import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { Carimbo } from "@/types/carimbo";

vi.mock("@/lib/api/services/carimbo", () => ({ carimbarTicket: vi.fn() }));

import { carimbarTicket } from "@/lib/api/services/carimbo";
import { REPETICAO_TOKEN_MS, useCarimbar } from "./useCarimbar";

const carimbar = vi.mocked(carimbarTicket);
const CARIMBO = { placa: "TEP6I32" } as Carimbo;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  carimbar.mockReset();
});

describe("useCarimbar", () => {
  it("carimba o token lido e guarda o resultado", async () => {
    carimbar.mockResolvedValue(CARIMBO);
    const { result } = renderHook(() => useCarimbar(), { wrapper });

    act(() => {
      expect(result.current.carimbar("58BMTFRW")).toBe(true);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(carimbar).toHaveBeenCalledWith("58BMTFRW");
    expect(result.current.data).toEqual(CARIMBO);
  });

  it("ignora novas leituras enquanto uma chamada está em andamento", async () => {
    carimbar.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCarimbar(), { wrapper });

    act(() => {
      result.current.carimbar("58BMTFRW");
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    act(() => {
      expect(result.current.carimbar("OUTROTKN")).toBe(false);
    });

    expect(carimbar).toHaveBeenCalledTimes(1);
  });

  it("depois de um erro, ignora o mesmo token por 5 s e aceita um token diferente", async () => {
    carimbar.mockRejectedValue(new ApiError("validation", "Este veículo já foi carimbado.", 400));
    const { result } = renderHook(() => useCarimbar(), { wrapper });

    act(() => {
      result.current.carimbar("58BMTFRW");
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    act(() => {
      expect(result.current.carimbar("58BMTFRW")).toBe(false);
    });
    expect(carimbar).toHaveBeenCalledTimes(1);

    act(() => {
      expect(result.current.carimbar("OUTROTKN")).toBe(true);
    });
    await waitFor(() => expect(carimbar).toHaveBeenCalledTimes(2));
  });

  it("aceita o mesmo token de novo depois da janela de repetição", async () => {
    carimbar.mockRejectedValue(new ApiError("validation", "Sem tabela de convênio.", 400));
    const { result } = renderHook(() => useCarimbar(), { wrapper });

    const agora = Date.now();
    const relogio = vi.spyOn(Date, "now").mockReturnValue(agora);
    act(() => {
      result.current.carimbar("58BMTFRW");
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    relogio.mockReturnValue(agora + REPETICAO_TOKEN_MS + 1);
    act(() => {
      expect(result.current.carimbar("58BMTFRW")).toBe(true);
    });
    await waitFor(() => expect(carimbar).toHaveBeenCalledTimes(2));
    relogio.mockRestore();
  });

  it("tentarNovamente reenvia o último token sem nova leitura", async () => {
    carimbar.mockRejectedValueOnce(new ApiError("network")).mockResolvedValue(CARIMBO);
    const { result } = renderHook(() => useCarimbar(), { wrapper });

    act(() => {
      result.current.carimbar("58BMTFRW");
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    act(() => result.current.tentarNovamente());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(carimbar).toHaveBeenNthCalledWith(2, "58BMTFRW");
  });

  it("reiniciar volta ao estado inicial e libera um novo carimbo", async () => {
    carimbar.mockResolvedValue(CARIMBO);
    const { result } = renderHook(() => useCarimbar(), { wrapper });

    act(() => {
      result.current.carimbar("58BMTFRW");
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => {
      expect(result.current.carimbar("OUTROTKN")).toBe(false);
    });

    act(() => result.current.reiniciar());
    await waitFor(() => expect(result.current.isIdle).toBe(true));
    act(() => {
      expect(result.current.carimbar("OUTROTKN")).toBe(true);
    });
    await waitFor(() => expect(carimbar).toHaveBeenCalledTimes(2));
  });
});
