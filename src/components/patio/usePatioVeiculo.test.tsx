import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { PatioVeiculo } from "@/types/patio";

vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn() }));

import { listPatio } from "@/lib/api/services/patio";
import { usePatioVeiculo } from "./usePatioVeiculo";

const base: PatioVeiculo = {
  patioId: 1,
  placa: "ABC1D23",
  categoria: 2,
  modelo: "Gol",
  cor: "PRATA",
  codigoTicket: null,
  sequencial: 10,
  mensalista: false,
  dataHoraEntrada: "2026-10-20T16:41:52",
  minutosPermanencia: 60,
  permanencia: "1h 0min",
  rotatividadeDescricao: null,
  usuarioEntrada: null,
  token: "ABCD1234",
};

function render(patioId: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => usePatioVeiculo(patioId), { wrapper });
}

describe("usePatioVeiculo", () => {
  beforeEach(() => {
    vi.mocked(listPatio).mockReset();
  });

  it("carrega, depois acha o veículo pelo id", async () => {
    vi.mocked(listPatio).mockResolvedValue([base, { ...base, patioId: 2, placa: "XYZ9K88" }]);
    const { result } = render(2);

    expect(result.current.carregando).toBe(true);
    expect(result.current.ausente).toBe(false);

    await waitFor(() => expect(result.current.veiculo?.placa).toBe("XYZ9K88"));
    expect(result.current.carregando).toBe(false);
    expect(result.current.ausente).toBe(false);
  });

  it("só marca ausente depois da primeira carga", async () => {
    vi.mocked(listPatio).mockResolvedValue([base]);
    const { result } = render(99);

    expect(result.current.ausente).toBe(false);
    await waitFor(() => expect(result.current.ausente).toBe(true));
    expect(result.current.veiculo).toBeNull();
  });

  it("expõe o erro quando a lista não chega", async () => {
    vi.mocked(listPatio).mockRejectedValue(new ApiError("server", "Falhou", 500));
    const { result } = render(1);

    await waitFor(() => expect(result.current.erro).not.toBeNull());
    expect(result.current.ausente).toBe(false);
  });
});
