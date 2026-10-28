import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { ComprovanteCliente } from "@/types/veiculo";

vi.mock("@/lib/api/services/patio", () => ({ consultarComprovante: vi.fn() }));

import { consultarComprovante } from "@/lib/api/services/patio";
import { useComprovanteTicket } from "./useComprovanteTicket";

const comprovante: ComprovanteCliente = {
  cnpj: "00000000000100",
  razaoSocial: "Estacionamento Teste",
  endereco: "Rua Exemplo, 123",
  telefone: "1100000000",
  placa: "ABC1D23",
  modelo: "Gol",
  cor: "PRATA",
  categoriaId: 2,
  categoriaDescricao: "Carro médio",
  dataHoraEntrada: "2026-10-20T16:41:52",
  dataHoraConsulta: "2026-10-20T17:41:52",
  minutosPermanencia: 60,
  permanencia: "1h 0min",
  sequencial: 10,
  token: "ABCD1234",
  valorAtual: 12,
};

function render(token: string | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useComprovanteTicket(token), { wrapper });
}

describe("useComprovanteTicket", () => {
  beforeEach(() => {
    vi.mocked(consultarComprovante).mockReset();
  });

  it("sem token não consulta", () => {
    const { result } = render(null);

    expect(result.current.fetchStatus).toBe("idle");
    expect(consultarComprovante).not.toHaveBeenCalled();
  });

  it("devolve o valor e os dados do estabelecimento", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    const { result } = render("ABCD1234");

    await waitFor(() => expect(result.current.data?.valorAtual).toBe(12));
    expect(consultarComprovante).toHaveBeenCalledWith("ABCD1234");
    expect(result.current.data?.razaoSocial).toBe("Estacionamento Teste");
  });

  it("expõe o erro da consulta", async () => {
    vi.mocked(consultarComprovante).mockRejectedValue(new ApiError("not_found", "Comprovante não encontrado.", 404));
    const { result } = render("ABCD1234");

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
