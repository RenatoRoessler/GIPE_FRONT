import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { ItemFila, ServicosDoVeiculo } from "@/types/servico";

const servico = vi.hoisted(() => ({ listFila: vi.fn(), atualizarStatusServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => servico);

import { filaServicosKey, servicosDoVeiculoKey } from "./servicosKeys";
import { useAtualizarStatusServico } from "./useAtualizarStatusServico";
import { INTERVALO_FILA_MS, useFilaServicos } from "./useFilaServicos";

const item = (patioServicoId: number, status: ItemFila["status"]): ItemFila => ({
  patioServicoId,
  idPatio: 30 + patioServicoId,
  nomeServico: "Lavagem",
  status,
  placa: `ABC${patioServicoId}D23`,
  modelo: null,
  cor: null,
  categoria: null,
  prisma: null,
  entradaEm: null,
});

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
});

describe("useFilaServicos", () => {
  it("lê a fila, passa o filtro de status e mostra quando chegou", async () => {
    servico.listFila.mockResolvedValue([item(1, 1)]);

    const { result } = renderHook(() => useFilaServicos(2), { wrapper: comCliente(criarCliente()) });
    expect(result.current.carregando).toBe(true);
    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    expect(servico.listFila).toHaveBeenCalledWith(2);
    expect(result.current.atualizadoEm).toBeGreaterThan(0);
  });

  it("se atualiza a cada 15 s, só com a aba à vista, e ao voltar o foco", () => {
    const client = criarCliente();
    servico.listFila.mockResolvedValue([]);
    renderHook(() => useFilaServicos(), { wrapper: comCliente(client) });

    const opcoes = client.getQueryCache().find({ queryKey: filaServicosKey() })?.observers[0].options;
    expect(INTERVALO_FILA_MS).toBe(15_000);
    expect(opcoes?.refetchInterval).toBe(15_000);
    expect(opcoes?.refetchIntervalInBackground).toBe(false);
    expect(opcoes?.refetchOnWindowFocus).toBe(true);
  });

  it("expõe o erro sem perder os itens já carregados", async () => {
    servico.listFila.mockResolvedValueOnce([item(1, 1)]).mockRejectedValueOnce(new ApiError("network"));
    const { result } = renderHook(() => useFilaServicos(), { wrapper: comCliente(criarCliente()) });
    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.erro).toBeInstanceOf(ApiError));
    expect(result.current.itens).toHaveLength(1);
  });
});

describe("useAtualizarStatusServico", () => {
  const troca = { idPatio: 31, patioServicoId: 1, destino: 2 as const };

  function prepararFila() {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, 1), item(2, 1)]);
    client.setQueryData(filaServicosKey(1), [item(1, 1), item(2, 1)]);
    client.setQueryData(filaServicosKey(2), []);
    return client;
  }

  it("move o cartão de coluna na hora, antes de o back responder, e confirma depois", async () => {
    let responder: () => void = () => {};
    servico.atualizarStatusServico.mockReturnValue(new Promise<void>((resolve) => (responder = resolve)));
    const client = prepararFila();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => {
      result.current.mutate(troca);
    });

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.find((linha) => linha.patioServicoId === 1)?.status).toBe(2));
    // A fila filtrada por Aguardando perde o cartão; a de Em execução ainda não o ganha (vem na releitura).
    expect(client.getQueryData<ItemFila[]>(filaServicosKey(1))?.map((linha) => linha.patioServicoId)).toEqual([2]);
    expect(servico.atualizarStatusServico).toHaveBeenCalledWith(31, 1, 2);

    servico.listFila.mockResolvedValue([]);
    await act(async () => responder());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("se o back recusar, o cartão volta para onde estava em todas as filas", async () => {
    servico.atualizarStatusServico.mockRejectedValue(new ApiError("network"));
    servico.listFila.mockImplementation(() => new Promise(() => {}));
    const client = prepararFila();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    await act(async () => {
      await expect(result.current.mutateAsync(troca)).rejects.toBeInstanceOf(ApiError);
    });

    expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.map((linha) => [linha.patioServicoId, linha.status])).toEqual([
      [1, 1],
      [2, 1],
    ]);
    expect(client.getQueryData<ItemFila[]>(filaServicosKey(1))).toHaveLength(2);
  });

  it("desfazer é trocar de volta para o status anterior", async () => {
    servico.atualizarStatusServico.mockResolvedValue(undefined);
    servico.listFila.mockResolvedValue([]);
    const client = prepararFila();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.mutateAsync(troca);
      await result.current.mutateAsync({ ...troca, destino: 1 });
    });

    expect(servico.atualizarStatusServico).toHaveBeenNthCalledWith(1, 31, 1, 2);
    expect(servico.atualizarStatusServico).toHaveBeenNthCalledWith(2, 31, 1, 1);
  });

  it("depois de trocar, lê de novo a fila e o pátio", async () => {
    servico.atualizarStatusServico.mockResolvedValue(undefined);
    servico.listFila.mockResolvedValue([]);
    const client = prepararFila();
    const invalidar = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.mutateAsync(troca);
    });

    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["servicos", "fila"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["patio"] });
  });

  describe("serviços do veículo no ticket", () => {
    const doVeiculo = (status: ServicosDoVeiculo["servicos"][number]["status"]): ServicosDoVeiculo => ({
      valorServicosCentavos: 5000,
      tempoPermitidoMinutos: null,
      livreAte: null,
      servicos: [1, 2].map((id) => ({
        id,
        servicoId: id,
        nome: `Serviço ${id}`,
        valorCentavos: 2500,
        tempoPermitidoMinutos: null,
        status: id === 1 ? status : 1,
        motivoCancelamento: null,
        adicionadoEm: null,
        adicionadoPor: null,
        previsaoEm: null,
        prontoEm: null,
      })),
    });

    const statusDe = (client: QueryClient, chave: ReturnType<typeof servicosDoVeiculoKey>) =>
      client.getQueryData<ServicosDoVeiculo>(chave)?.servicos.map((linha) => [linha.id, linha.status]);

    function prepararVeiculo() {
      const client = prepararFila();
      client.setQueryData(servicosDoVeiculoKey(31, false), doVeiculo(1));
      client.setQueryData(servicosDoVeiculoKey(31, true), doVeiculo(1));
      // Outro veículo não é tocado.
      client.setQueryData(servicosDoVeiculoKey(99, false), doVeiculo(1));
      return client;
    }

    it("muda o serviço na lista do veículo na hora, nas duas consultas, sem tocar em outro veículo", async () => {
      servico.atualizarStatusServico.mockReturnValue(new Promise<void>(() => {}));
      const client = prepararVeiculo();
      const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

      act(() => {
        result.current.mutate(troca);
      });

      await waitFor(() => expect(statusDe(client, servicosDoVeiculoKey(31, false))).toEqual([[1, 2], [2, 1]]));
      expect(statusDe(client, servicosDoVeiculoKey(31, true))).toEqual([[1, 2], [2, 1]]);
      expect(statusDe(client, servicosDoVeiculoKey(99, false))).toEqual([[1, 1], [2, 1]]);
    });

    it("se o back recusar, a lista do veículo volta ao que era", async () => {
      servico.atualizarStatusServico.mockRejectedValue(new ApiError("network"));
      servico.listFila.mockImplementation(() => new Promise(() => {}));
      const client = prepararVeiculo();
      const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

      await act(async () => {
        await expect(result.current.mutateAsync(troca)).rejects.toBeInstanceOf(ApiError);
      });

      expect(statusDe(client, servicosDoVeiculoKey(31, false))).toEqual([[1, 1], [2, 1]]);
      expect(statusDe(client, servicosDoVeiculoKey(31, true))).toEqual([[1, 1], [2, 1]]);
    });
  });
});
