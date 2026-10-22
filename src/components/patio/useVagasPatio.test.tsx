import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { EmpresaFormValues } from "@/types/empresa";

vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn(), updateEmpresa: vi.fn() }));

import { getEmpresa } from "@/lib/api/services/empresa";
import { useVagasPatio } from "./useVagasPatio";

function empresa(moto: string, carro: string) {
  return { company: { quantidadeVagasMoto: moto, quantidadeVagasCarro: carro } } as EmpresaFormValues;
}

// Um cliente por teste, criado fora do componente: recriá-lo a cada render descartaria o cache.
function criarWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, Wrapper };
}

beforeEach(() => {
  vi.mocked(getEmpresa).mockReset();
});

describe("useVagasPatio", () => {
  it("lê as vagas de moto e de carro da empresa", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa("12", "23"));

    const { Wrapper } = criarWrapper();
    const { result } = renderHook(() => useVagasPatio(), { wrapper: Wrapper });

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual({ moto: 12, carro: 23 }));
  });

  it("sem vagas cadastradas devolve null", async () => {
    vi.mocked(getEmpresa).mockResolvedValue(empresa("0", ""));

    const { client, Wrapper } = criarWrapper();
    const { result } = renderHook(() => useVagasPatio(), { wrapper: Wrapper });

    await waitFor(() => expect(getEmpresa).toHaveBeenCalled());
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(result.current).toBeNull();
  });

  it("erro da API devolve null, sem derrubar a tela", async () => {
    vi.mocked(getEmpresa).mockImplementation(() => Promise.reject(new ApiError("server")));

    const { client, Wrapper } = criarWrapper();
    const { result } = renderHook(() => useVagasPatio(), { wrapper: Wrapper });

    await waitFor(() => expect(getEmpresa).toHaveBeenCalled());
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(result.current).toBeNull();
  });
});
