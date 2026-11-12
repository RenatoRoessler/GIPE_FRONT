import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const servico = vi.hoisted(() => ({
  listServicos: vi.fn(),
  criarServico: vi.fn(),
  atualizarServico: vi.fn(),
  inativarServico: vi.fn(),
}));
vi.mock("@/lib/api/services/servico", () => servico);

import { SERVICOS_LISTA_KEY, servicosListaKey } from "./servicosKeys";
import { useServicoMutations, useServicos } from "./useServicos";

const payload = { nome: "Lavagem", descricao: null, duracaoMinutos: 60, tempoPermitidoMinutos: null, precos: [{ categoria: 99, valor: 50 }] };

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

describe("useServicos", () => {
  it("lista sem filtro e passa o filtro de ativo ao serviço", async () => {
    servico.listServicos.mockResolvedValue([{ id: 1, nome: "Cera" }]);

    const { result } = renderHook(() => useServicos(), { wrapper: comCliente(criarCliente()) });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(servico.listServicos).toHaveBeenCalledWith(undefined);

    renderHook(() => useServicos(false), { wrapper: comCliente(criarCliente()) });
    await waitFor(() => expect(servico.listServicos).toHaveBeenCalledWith(false));
  });

  it("expõe o erro", async () => {
    servico.listServicos.mockRejectedValue(new ApiError("forbidden"));

    const { result } = renderHook(() => useServicos(true), { wrapper: comCliente(criarCliente()) });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
  });
});

describe("useServicoMutations", () => {
  it("criar, atualizar e inativar chamam o serviço e leem a lista de novo", async () => {
    const client = criarCliente();
    const invalidar = vi.spyOn(client, "invalidateQueries");
    servico.criarServico.mockResolvedValue({ id: 9 });
    servico.atualizarServico.mockResolvedValue({ id: 9 });
    servico.inativarServico.mockResolvedValue(undefined);
    const { result } = renderHook(() => useServicoMutations(), { wrapper: comCliente(client) });

    await act(async () => {
      await result.current.criar.mutateAsync(payload);
      await result.current.atualizar.mutateAsync({ id: 9, payload });
      await result.current.inativar.mutateAsync(9);
    });

    expect(servico.criarServico).toHaveBeenCalledWith(payload);
    expect(servico.atualizarServico).toHaveBeenCalledWith(9, payload);
    expect(servico.inativarServico).toHaveBeenCalledWith(9);
    expect(invalidar).toHaveBeenCalledTimes(3);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: SERVICOS_LISTA_KEY });
    expect(servicosListaKey(true).slice(0, 2)).toEqual([...SERVICOS_LISTA_KEY]);
  });

  it("erro 400 do back chega ao chamador com a mensagem e não lê a lista de novo", async () => {
    const client = criarCliente();
    const invalidar = vi.spyOn(client, "invalidateQueries");
    servico.criarServico.mockRejectedValue(new ApiError("validation", "Já existe um serviço ativo com esse nome."));
    const { result } = renderHook(() => useServicoMutations(), { wrapper: comCliente(client) });

    await act(async () => {
      await expect(result.current.criar.mutateAsync(payload)).rejects.toMatchObject({ message: "Já existe um serviço ativo com esse nome." });
    });
    expect(invalidar).not.toHaveBeenCalled();
  });
});
