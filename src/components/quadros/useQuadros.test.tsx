import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QuadroChaves } from "@/types/quadroChaves";

vi.mock("@/lib/api/services/quadroChaves", () => ({ listQuadros: vi.fn() }));

import { listQuadros } from "@/lib/api/services/quadroChaves";
import { QUADROS_QUERY_KEY } from "./quadrosKeys";
import { useQuadros } from "./useQuadros";

const quadro: QuadroChaves = { patioQuadroId: 1, nome: "Recepção", linhas: [] };

function renderQuadros() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useQuadros(), { wrapper }) };
}

describe("useQuadros", () => {
  beforeEach(() => {
    vi.mocked(listQuadros).mockReset().mockResolvedValue([quadro]);
  });

  it("usa a chave dos quadros e carrega a lista", async () => {
    const { result, queryClient } = renderQuadros();
    await waitFor(() => expect(result.current.data).toEqual([quadro]));
    expect(queryClient.getQueryData(QUADROS_QUERY_KEY)).toEqual([quadro]);
  });

  it("invalidar a chave dos quadros recarrega a lista", async () => {
    const { result, queryClient } = renderQuadros();
    await waitFor(() => expect(result.current.data).toEqual([quadro]));
    vi.mocked(listQuadros).mockResolvedValue([]);
    await queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY });
    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(listQuadros).toHaveBeenCalledTimes(2);
  });
});
