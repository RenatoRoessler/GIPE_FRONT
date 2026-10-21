import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/services/mensalista", () => ({ listAllMensalistas: vi.fn() }));

import { listAllMensalistas } from "@/lib/api/services/mensalista";
import { AGENDA_QUERY_KEY, useAgendaMensalistas } from "./useAgendaMensalistas";
import { MENSALISTAS_QUERY_KEY } from "./useTiposMensalidade";

const resposta = { items: [], totalRecords: 0, truncado: false };

function renderAgenda() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useAgendaMensalistas(), { wrapper }) };
}

describe("useAgendaMensalistas", () => {
  beforeEach(() => {
    vi.mocked(listAllMensalistas).mockReset().mockResolvedValue(resposta);
  });

  it("carrega todos os cadastros", async () => {
    const { result } = renderAgenda();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(resposta);
    expect(listAllMensalistas).toHaveBeenCalledTimes(1);
  });

  it("fica sob o prefixo dos mensalistas, então pagar ou reenviar o contrato o atualiza", async () => {
    const { result, queryClient } = renderAgenda();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(AGENDA_QUERY_KEY.slice(0, MENSALISTAS_QUERY_KEY.length)).toEqual([...MENSALISTAS_QUERY_KEY]);

    await queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY });
    await waitFor(() => expect(listAllMensalistas).toHaveBeenCalledTimes(2));
  });

  it("expõe o erro da API", async () => {
    vi.mocked(listAllMensalistas).mockRejectedValue(new Error("falhou"));
    const { result } = renderAgenda();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("falhou");
  });
});
