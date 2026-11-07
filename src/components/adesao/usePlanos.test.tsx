import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { PlanoAdesao } from "@/types/plano";

vi.mock("@/lib/api/services/plano", () => ({ listPlanos: vi.fn() }));

import { listPlanos } from "@/lib/api/services/plano";
import { PLANOS_QUERY_KEY, usePlanos } from "./usePlanos";

const MENSAL: PlanoAdesao = {
  id: 2,
  tipo: 1,
  nome: "Mensal",
  meses: 1,
  centavosTabela: 9990,
  centavosAtual: 6990,
  emPromocao: true,
  promocaoAte: "2027-06-30",
};

function criarWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("usePlanos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devolve os planos mapeados", async () => {
    vi.mocked(listPlanos).mockResolvedValue([MENSAL]);
    const queryClient = new QueryClient();
    const { result } = renderHook(() => usePlanos(), { wrapper: criarWrapper(queryClient) });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual([MENSAL]);
    expect(queryClient.getQueryData(PLANOS_QUERY_KEY)).toEqual([MENSAL]);
  });

  it("não refaz a chamada numa segunda montagem dentro dos 5 minutos", async () => {
    vi.mocked(listPlanos).mockResolvedValue([MENSAL]);
    const queryClient = new QueryClient();
    const wrapper = criarWrapper(queryClient);

    const primeira = renderHook(() => usePlanos(), { wrapper });
    await waitFor(() => expect(primeira.result.current.status).toBe("success"));
    primeira.unmount();

    const segunda = renderHook(() => usePlanos(), { wrapper });
    expect(segunda.result.current.data).toEqual([MENSAL]);
    expect(listPlanos).toHaveBeenCalledTimes(1);
  });

  it("vai para o estado de erro depois de uma nova tentativa", async () => {
    vi.mocked(listPlanos).mockRejectedValue(new ApiError("network"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
    const { result } = renderHook(() => usePlanos(), { wrapper: criarWrapper(queryClient) });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(listPlanos).toHaveBeenCalledTimes(2);
  });
});
