import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { STATUS_SERVICO, type ItemFila, type ServicosDoVeiculo } from "@/types/servico";

const servico = vi.hoisted(() => ({ listFila: vi.fn(), atualizarStatusServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => servico);

import { filaServicosKey, servicosDoVeiculoKey } from "./servicosKeys";
import { useAtualizarStatusServico } from "./useAtualizarStatusServico";

const AGORA_LOCAL = "2026-11-14T15:30:05";

const item = (id: number, status: ItemFila["status"], extra: Partial<ItemFila> = {}): ItemFila => ({
  patioServicoId: id,
  idPatio: 30,
  nomeServico: "Lavagem",
  status,
  placa: "ABC1D23",
  modelo: null,
  cor: null,
  categoria: null,
  prisma: null,
  entradaEm: null,
  criadoEm: "2026-11-14T14:00:00",
  iniciadoEm: null,
  prontoEm: null,
  duracaoMinutos: 30,
  ...extra,
});

function criarCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
}

function comCliente(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

// O back demora: quem chama vê a fila no meio do caminho, já com a troca aplicada.
function trocaLenta() {
  let concluir: () => void = () => undefined;
  servico.atualizarStatusServico.mockReturnValue(new Promise<void>((resolve) => (concluir = resolve)));
  return { concluir: () => concluir() };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(AGORA_LOCAL));
});

afterEach(() => vi.useRealTimers());

describe("useAtualizarStatusServico: datas na troca otimista", () => {
  it("Iniciar marca a hora de início na hora, sem esperar o back", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.Aguardando)]);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.EmExecucao }));

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: AGORA_LOCAL, prontoEm: null }));
    lenta.concluir();
  });

  it("Marcar como pronto mantém o início que já havia e marca o pronto", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.EmExecucao, { iniciadoEm: "2026-11-14T15:00:00" })]);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.Pronto }));

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.Pronto, iniciadoEm: "2026-11-14T15:00:00", prontoEm: AGORA_LOCAL }));
    lenta.concluir();
  });

  it("de Na fila direto para Pronto, o início também fica marcado", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.Aguardando)]);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.Pronto }));

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ iniciadoEm: AGORA_LOCAL, prontoEm: AGORA_LOCAL }));
    lenta.concluir();
  });

  it("voltar de Pronto para Em andamento apaga o pronto e mantém o início", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.Pronto, { iniciadoEm: "2026-11-14T15:00:00", prontoEm: "2026-11-14T15:20:00" })]);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.EmExecucao }));

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: "2026-11-14T15:00:00", prontoEm: null }));
    lenta.concluir();
  });

  it("voltar para a fila não mexe nas datas (o que o back faz com elas não está documentado)", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.EmExecucao, { iniciadoEm: "2026-11-14T15:00:00" })]);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.Aguardando }));

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.Aguardando, iniciadoEm: "2026-11-14T15:00:00" }));
    lenta.concluir();
  });

  it("iniciar de novo um serviço que voltou para a fila começa uma contagem nova", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.Aguardando, { iniciadoEm: "2026-11-14T14:00:00" })]);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.EmExecucao }));

    await waitFor(() => expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ iniciadoEm: AGORA_LOCAL }));
    lenta.concluir();
  });

  it("se o back recusar, o cartão volta com o status e as datas de antes", async () => {
    const client = criarCliente();
    const antes = item(1, STATUS_SERVICO.Aguardando);
    client.setQueryData(filaServicosKey(), [antes]);
    servico.atualizarStatusServico.mockRejectedValue(new ApiError("validation", "Serviço já foi cancelado."));
    servico.listFila.mockResolvedValue([antes]);
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.mutateAsync({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.EmExecucao }).catch(() => undefined);
    });

    expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.Aguardando, iniciadoEm: null, prontoEm: null });
  });

  it("desfazer (a troca no sentido contrário) devolve o cartão ao estado anterior", async () => {
    const client = criarCliente();
    client.setQueryData(filaServicosKey(), [item(1, STATUS_SERVICO.Aguardando)]);
    servico.atualizarStatusServico.mockResolvedValue(undefined);
    servico.listFila.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.mutateAsync({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.EmExecucao });
    });
    expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.EmExecucao, iniciadoEm: AGORA_LOCAL });

    await act(async () => {
      await result.current.mutateAsync({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.Aguardando });
    });
    expect(client.getQueryData<ItemFila[]>(filaServicosKey())?.[0]).toMatchObject({ status: STATUS_SERVICO.Aguardando });
  });

  it("nos serviços do veículo (ticket do Pátio), Pronto marca a hora e voltar a apaga", async () => {
    const client = criarCliente();
    const dados: ServicosDoVeiculo = {
      valorServicosCentavos: 5000,
      tempoPermitidoMinutos: null,
      livreAte: null,
      servicos: [
        { id: 1, servicoId: 1, nome: "Lavagem", valorCentavos: 5000, tempoPermitidoMinutos: null, status: STATUS_SERVICO.EmExecucao, motivoCancelamento: null, adicionadoEm: null, adicionadoPor: null, previsaoEm: null, prontoEm: null },
      ],
    };
    client.setQueryData(servicosDoVeiculoKey(30, false), dados);
    const lenta = trocaLenta();
    const { result } = renderHook(() => useAtualizarStatusServico(), { wrapper: comCliente(client) });

    act(() => result.current.mutate({ idPatio: 30, patioServicoId: 1, destino: STATUS_SERVICO.Pronto }));

    await waitFor(() => expect(client.getQueryData<ServicosDoVeiculo>(servicosDoVeiculoKey(30, false))?.servicos[0]).toMatchObject({ status: STATUS_SERVICO.Pronto, prontoEm: AGORA_LOCAL }));
    lenta.concluir();
  });
});
