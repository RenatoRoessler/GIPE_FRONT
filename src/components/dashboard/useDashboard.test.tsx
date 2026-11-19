import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { ApiError } from "@/lib/api/errors";

vi.mock("@/lib/api/services/dashboard", () => ({ getDashboard: vi.fn() }));
vi.mock("@/hooks/useCan", () => ({ useCan: vi.fn() }));

import { useCan } from "@/hooks/useCan";
import { getDashboard } from "@/lib/api/services/dashboard";
import { DASHBOARD_QUERY_KEY, useDashboard, type UseDashboardOptions } from "./useDashboard";

const hoje = fromDashboardResponse(dashboardDto);
const outubro = fromDashboardResponse(dashboardMesFechadoDto());

function renderDashboard(opcoes: UseDashboardOptions) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, ...renderHook((props: UseDashboardOptions) => useDashboard(props), { wrapper, initialProps: opcoes }) };
}

describe("useDashboard", () => {
  beforeEach(() => {
    vi.mocked(getDashboard).mockReset().mockResolvedValue(hoje);
    vi.mocked(useCan).mockReset().mockReturnValue(true);
  });

  it("consulta o período e guarda o resultado na chave ['dashboard', período, data]", async () => {
    const { result, queryClient } = renderDashboard({ periodo: 3, data: "2026-10-01" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getDashboard).toHaveBeenCalledWith({ periodo: 3, data: "2026-10-01" });
    expect(queryClient.getQueryData([...DASHBOARD_QUERY_KEY, 3, "2026-10-01"])).toBe(hoje);
  });

  it("sem data (período atual) usa a chave com data nula", async () => {
    const { result, queryClient } = renderDashboard({ periodo: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getDashboard).toHaveBeenCalledWith({ periodo: 1, data: undefined });
    expect(queryClient.getQueryData([...DASHBOARD_QUERY_KEY, 1, null])).toBe(hoje);
  });

  it("na troca de período mantém o resultado anterior até o novo chegar", async () => {
    let entregar: (valor: typeof outubro) => void = () => {};
    const { result, rerender } = renderDashboard({ periodo: 1 });
    await waitFor(() => expect(result.current.data).toBe(hoje));

    vi.mocked(getDashboard).mockReturnValueOnce(new Promise((resolver) => (entregar = resolver)));
    rerender({ periodo: 3, data: "2026-10-01" });

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
    expect(result.current.data).toBe(hoje);

    await act(async () => entregar(outubro));

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data).toBe(outubro);
  });

  it("sem permissão não faz nenhuma chamada", async () => {
    vi.mocked(useCan).mockReturnValue(false);

    const { result } = renderDashboard({ periodo: 1 });

    await new Promise((resolver) => setTimeout(resolver, 20));

    expect(getDashboard).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("o erro da API chega ao hook e refetch tenta de novo", async () => {
    vi.mocked(getDashboard).mockRejectedValueOnce(new ApiError("server"));
    const { result } = renderDashboard({ periodo: 1 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(hoje);
    expect(getDashboard).toHaveBeenCalledTimes(2);
  });
});
