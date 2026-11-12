import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const servico = vi.hoisted(() => ({ listServicosDoVeiculo: vi.fn(), acrescentarServicos: vi.fn(), cancelarServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => servico);

const configuracao = vi.hoisted(() => ({ atual: { configuracao: { servicos: true }, carregada: true } }));
vi.mock("@/components/configuracoes/useConfiguracao", () => ({ useConfiguracao: () => configuracao.atual }));

import { MOTIVO_MAXIMO, useAcrescentarServicos, useCancelarServico, useServicosDoVeiculo, useServicosHabilitados } from "./useServicosDoVeiculo";

const VEICULO = { valorServicosCentavos: 4000, tempoPermitidoMinutos: null, livreAte: null, servicos: [] };

function criarCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function comCliente(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  configuracao.atual = { configuracao: { servicos: true }, carregada: true };
});

describe("useServicosDoVeiculo", () => {
  it("lê os serviços do veículo, com ou sem cancelados", async () => {
    servico.listServicosDoVeiculo.mockResolvedValue(VEICULO);
    const wrapper = comCliente(criarCliente());

    const { result } = renderHook(() => useServicosDoVeiculo(30, true), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(VEICULO));

    expect(servico.listServicosDoVeiculo).toHaveBeenCalledWith(30, { incluirCancelados: true });
  });

  it("não consulta quando desabilitado", () => {
    renderHook(() => useServicosDoVeiculo(30, false, false), { wrapper: comCliente(criarCliente()) });
    expect(servico.listServicosDoVeiculo).not.toHaveBeenCalled();
  });
});

describe("useAcrescentarServicos e useCancelarServico", () => {
  it("acrescentar manda os ids e lê de novo o pátio e a fila", async () => {
    servico.acrescentarServicos.mockResolvedValue(VEICULO);
    const client = criarCliente();
    const invalidar = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAcrescentarServicos(30), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.mutateAsync([1, 3]);
    });

    expect(servico.acrescentarServicos).toHaveBeenCalledWith(30, [1, 3]);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["patio"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["servicos", "fila"] });
  });

  it("cancelar manda o motivo aparado e lê de novo o pátio e a fila", async () => {
    servico.cancelarServico.mockResolvedValue(VEICULO);
    const client = criarCliente();
    const invalidar = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCancelarServico(30), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.mutateAsync({ patioServicoId: 11, motivo: "  Cliente desistiu  " });
    });

    expect(servico.cancelarServico).toHaveBeenCalledWith(30, 11, "Cliente desistiu");
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["patio"] });
  });

  it("cancelar sem motivo, ou com motivo longo demais, nem chega ao back", async () => {
    const { result } = renderHook(() => useCancelarServico(30), { wrapper: comCliente(criarCliente()) });

    await act(async () => {
      await expect(result.current.mutateAsync({ patioServicoId: 11, motivo: "   " })).rejects.toMatchObject({ kind: "validation" });
      await expect(result.current.mutateAsync({ patioServicoId: 11, motivo: "x".repeat(MOTIVO_MAXIMO + 1) })).rejects.toMatchObject({ kind: "validation" });
    });

    expect(servico.cancelarServico).not.toHaveBeenCalled();
  });

  it("o erro do back (serviço que já começou) chega ao chamador", async () => {
    servico.cancelarServico.mockRejectedValue(new ApiError("validation", "Só serviço Aguardando pode ser cancelado."));
    const { result } = renderHook(() => useCancelarServico(30), { wrapper: comCliente(criarCliente()) });

    await act(async () => {
      await expect(result.current.mutateAsync({ patioServicoId: 11, motivo: "x" })).rejects.toMatchObject({ message: "Só serviço Aguardando pode ser cancelado." });
    });
  });
});

describe("useServicosHabilitados", () => {
  it("é verdadeiro só com a configuração carregada e os serviços ligados", () => {
    expect(renderHook(() => useServicosHabilitados()).result.current).toBe(true);

    configuracao.atual = { configuracao: { servicos: false }, carregada: true };
    expect(renderHook(() => useServicosHabilitados()).result.current).toBe(false);
  });

  it("enquanto a configuração carrega, é falso mesmo com o valor padrão ligado", () => {
    configuracao.atual = { configuracao: { servicos: true }, carregada: false };
    expect(renderHook(() => useServicosHabilitados()).result.current).toBe(false);
  });
});
