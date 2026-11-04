import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  conferenciaAberta,
  conferenciaFinalizada,
  itemNaoEncontrado,
  itemPendente,
  leituraConferido,
  leituraJaConferido,
  leituraSemEntrada,
} from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse, fromItemResponse, fromLeituraResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { METODO_CONFERENCIA, ORIGEM_ITEM, SITUACAO_ITEM, SITUACAO_SEM_ENTRADA, type Conferencia } from "@/types/conferenciaPatio";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({
  iniciarConferencia: vi.fn(),
  lerPlaca: vi.fn(),
  marcarItem: vi.fn(),
  descartarSemEntrada: vi.fn(),
  finalizarConferencia: vi.fn(),
}));

import {
  descartarSemEntrada,
  finalizarConferencia,
  iniciarConferencia,
  lerPlaca,
  marcarItem,
} from "@/lib/api/services/conferenciaPatio";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { conferenciaAbertaKey, conferenciaResumoKey } from "./conferenciaKeys";
import { atualizarAposAjuste, REPETICAO_LEITURA_MS, useConferenciaAcoes, type UseConferenciaAcoesOptions } from "./useConferenciaAcoes";

const conferencia = fromConferenciaResponse(conferenciaAberta);
const finalizada = fromConferenciaResponse(conferenciaFinalizada);

function renderAcoes(options: UseConferenciaAcoesOptions = {}, base: Conferencia | null = conferencia) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(conferenciaAbertaKey, base);
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useConferenciaAcoes(base, options), { wrapper });
  const cache = () => queryClient.getQueryData<Conferencia | null>(conferenciaAbertaKey);
  return { queryClient, cache, ...hook };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("iniciar", () => {
  it("coloca a conferência no cache e invalida o resumo", async () => {
    vi.mocked(iniciarConferencia).mockResolvedValue(conferencia);
    const { result, cache, queryClient } = renderAcoes({}, null);
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      await result.current.iniciar(METODO_CONFERENCIA.Lista);
    });

    expect(iniciarConferencia).toHaveBeenCalledWith(2);
    expect(cache()).toEqual(conferencia);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: conferenciaResumoKey });
  });

  it("o 400 refaz a busca da aberta (outro operador iniciou)", async () => {
    vi.mocked(iniciarConferencia).mockRejectedValue(new ApiError("validation", "Já existe uma conferência aberta.", 400));
    const { result, queryClient } = renderAcoes({}, null);
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      await expect(result.current.iniciar(METODO_CONFERENCIA.Camera)).rejects.toMatchObject({ kind: "validation" });
    });

    expect(invalidar).toHaveBeenCalledWith({ queryKey: conferenciaAbertaKey });
  });
});

describe("ler", () => {
  it("aplica o item conferido ao cache só depois da resposta", async () => {
    let resolver: (valor: ReturnType<typeof fromLeituraResponse>) => void = () => undefined;
    vi.mocked(lerPlaca).mockReturnValue(new Promise((resolve) => (resolver = resolve)));
    const { result, cache } = renderAcoes();
    const pendente = (placa: string) => cache()?.itens.find((i) => i.placa === placa)?.situacao;

    let promessa: Promise<unknown> = Promise.resolve();
    act(() => {
      promessa = result.current.ler("aaa-1a11", ORIGEM_ITEM.Manual);
    });
    await waitFor(() => expect(lerPlaca).toHaveBeenCalledWith(1, { placa: "AAA1A11", origem: 2 }));
    expect(pendente("AAA1A11")).toBe(SITUACAO_ITEM.Pendente);
    expect(result.current.ultimaLeitura).toBeNull();

    await act(async () => {
      resolver(fromLeituraResponse({ ...leituraConferido, placa: "AAA1A11", item: { ...itemPendente, situacao: 2, origem: 2 } }));
      await promessa;
    });
    expect(pendente("AAA1A11")).toBe(SITUACAO_ITEM.Conferido);
    expect(result.current.ultimaLeitura).toMatchObject({ placa: "AAA1A11", leitura: { resultado: 1 } });
  });

  it("guarda a placa sem entrada como divergência", async () => {
    vi.mocked(lerPlaca).mockResolvedValue(fromLeituraResponse(leituraSemEntrada));
    const { result, cache } = renderAcoes({}, { ...conferencia, semEntrada: [] });

    await act(async () => {
      await result.current.ler("ZZZ9Z99", ORIGEM_ITEM.Camera);
    });

    expect(cache()?.semEntrada.map((linha) => linha.placa)).toEqual(["ZZZ9Z99"]);
  });

  it("acrescenta o item de um carro que entrou depois do início", async () => {
    const novo = { ...leituraConferido, placa: "NEW9N99", item: { ...leituraConferido.item, patioConferenciaItemId: 99, placa: "NEW9N99" } };
    vi.mocked(lerPlaca).mockResolvedValue(fromLeituraResponse(novo));
    const { result, cache } = renderAcoes();

    await act(async () => {
      await result.current.ler("NEW9N99", ORIGEM_ITEM.Camera);
    });

    expect(cache()?.itens).toHaveLength(conferencia.itens.length + 1);
  });

  it("ignora a mesma placa da câmera dentro de 5 segundos, mas não a digitada", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(lerPlaca).mockResolvedValue(fromLeituraResponse(leituraJaConferido));
    const { result } = renderAcoes();

    await act(async () => {
      await result.current.ler("BBB2B22", ORIGEM_ITEM.Camera);
    });
    let repetida: unknown;
    await act(async () => {
      repetida = await result.current.ler("BBB-2B22", ORIGEM_ITEM.Camera);
    });
    expect(repetida).toBeNull();
    expect(lerPlaca).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.ler("BBB2B22", ORIGEM_ITEM.Manual);
    });
    expect(lerPlaca).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(REPETICAO_LEITURA_MS + 100);
      await result.current.ler("BBB2B22", ORIGEM_ITEM.Camera);
    });
    expect(lerPlaca).toHaveBeenCalledTimes(3);
  });

  it("envia as leituras em série, na ordem em que foram vistas", async () => {
    const resolvers: Array<() => void> = [];
    vi.mocked(lerPlaca).mockImplementation(
      (_id, { placa }) =>
        new Promise((resolve) => {
          resolvers.push(() => resolve(fromLeituraResponse({ ...leituraConferido, placa })));
        }),
    );
    const { result } = renderAcoes();

    let a: Promise<unknown> = Promise.resolve();
    let b: Promise<unknown> = Promise.resolve();
    act(() => {
      a = result.current.ler("AAA1A11", ORIGEM_ITEM.Camera);
      b = result.current.ler("CCC3C33", ORIGEM_ITEM.Camera);
    });

    await waitFor(() => expect(lerPlaca).toHaveBeenCalledTimes(1));
    expect(vi.mocked(lerPlaca).mock.calls[0][1].placa).toBe("AAA1A11");

    await act(async () => {
      resolvers[0]();
      await a;
    });
    await waitFor(() => expect(lerPlaca).toHaveBeenCalledTimes(2));
    expect(vi.mocked(lerPlaca).mock.calls[1][1].placa).toBe("CCC3C33");

    await act(async () => {
      resolvers[1]();
      await b;
    });
  });

  it("a falha avisa, não entra no cache, libera a placa e a fila segue", async () => {
    const onErroLeitura = vi.fn();
    vi.mocked(lerPlaca)
      .mockRejectedValueOnce(new ApiError("network", undefined, undefined))
      .mockResolvedValueOnce(fromLeituraResponse(leituraConferido));
    const { result } = renderAcoes({ onErroLeitura });

    await act(async () => {
      await expect(result.current.ler("BBB2B22", ORIGEM_ITEM.Camera)).rejects.toMatchObject({ kind: "network" });
    });
    expect(onErroLeitura).toHaveBeenCalledWith("BBB2B22", expect.objectContaining({ kind: "network" }));
    expect(result.current.ultimaLeitura).toBeNull();

    // A mesma placa pode ser tentada de novo logo em seguida (a falha não conta como vista).
    await act(async () => {
      await result.current.ler("BBB2B22", ORIGEM_ITEM.Camera);
    });
    expect(lerPlaca).toHaveBeenCalledTimes(2);
  });

  it("sem conferência ou com placa vazia não chama a API", async () => {
    const { result } = renderAcoes({}, null);
    await act(async () => {
      expect(await result.current.ler("AAA1A11", ORIGEM_ITEM.Camera)).toBeNull();
    });
    const outro = renderAcoes();
    await act(async () => {
      expect(await outro.result.current.ler("--", ORIGEM_ITEM.Camera)).toBeNull();
    });
    expect(lerPlaca).not.toHaveBeenCalled();
  });
});

describe("marcar", () => {
  it("troca o item pelo devolvido", async () => {
    vi.mocked(marcarItem).mockResolvedValue(fromItemResponse({ ...itemPendente, situacao: 3 })!);
    const { result, cache } = renderAcoes();

    await act(async () => {
      await result.current.marcar(1, SITUACAO_ITEM.NaoEncontrado);
    });

    expect(marcarItem).toHaveBeenCalledWith(1, 1, 3);
    expect(cache()?.itens.find((i) => i.patioConferenciaItemId === 1)?.situacao).toBe(SITUACAO_ITEM.NaoEncontrado);
  });

  it("não mexe no cache quando a API recusa", async () => {
    vi.mocked(marcarItem).mockRejectedValue(new ApiError("not_found", undefined, 404));
    const { result, cache } = renderAcoes();

    await act(async () => {
      await expect(result.current.marcar(1, SITUACAO_ITEM.Conferido)).rejects.toMatchObject({ kind: "not_found" });
    });

    expect(cache()?.itens.find((i) => i.patioConferenciaItemId === itemNaoEncontrado.patioConferenciaItemId)?.situacao).toBe(SITUACAO_ITEM.NaoEncontrado);
    expect(cache()?.itens.find((i) => i.patioConferenciaItemId === 1)?.situacao).toBe(SITUACAO_ITEM.Pendente);
  });
});

describe("descartar", () => {
  it("marca a linha como descartada e refaz a busca", async () => {
    vi.mocked(descartarSemEntrada).mockResolvedValue(undefined);
    const { result, cache, queryClient } = renderAcoes();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      await result.current.descartar("zzz-9z99");
    });

    expect(descartarSemEntrada).toHaveBeenCalledWith(1, "zzz-9z99");
    expect(cache()?.semEntrada[0].situacao).toBe(SITUACAO_SEM_ENTRADA.Descartada);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: conferenciaAbertaKey });
  });
});

describe("finalizar", () => {
  it("limpa o cache da aberta e invalida o resumo", async () => {
    vi.mocked(finalizarConferencia).mockResolvedValue(finalizada);
    const { result, cache, queryClient } = renderAcoes();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      await result.current.finalizar("Tudo certo");
    });

    expect(finalizarConferencia).toHaveBeenCalledWith(1, "Tudo certo");
    expect(cache()).toBeNull();
    expect(invalidar).toHaveBeenCalledWith({ queryKey: conferenciaResumoKey });
  });

  it("o erro mantém a conferência aberta", async () => {
    vi.mocked(finalizarConferencia).mockRejectedValue(new ApiError("server", undefined, 500));
    const { result, cache } = renderAcoes();

    await act(async () => {
      await expect(result.current.finalizar()).rejects.toMatchObject({ kind: "server" });
    });

    expect(cache()).toEqual(conferencia);
  });
});

describe("atualizarAposAjuste", () => {
  it("invalida a conferência, o resumo, o pátio, os quadros e o caixa", () => {
    const queryClient = new QueryClient();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    atualizarAposAjuste(queryClient);
    const chaves = invalidar.mock.calls.map(([filtro]) => (filtro as { queryKey: readonly string[] }).queryKey[0]);
    expect(chaves).toEqual(expect.arrayContaining(["conferencia-patio", PATIO_QUERY_KEY[0], "quadros-chaves", "caixa"]));
  });
});
