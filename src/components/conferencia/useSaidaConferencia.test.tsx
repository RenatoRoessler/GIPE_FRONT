import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { conferenciaAberta } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { MOTIVO_SAIDA } from "@/types/conferenciaPatio";
import type { SaidaRegistrada } from "@/types/saida";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({ darSaidaPeloItem: vi.fn() }));

import { darSaidaPeloItem } from "@/lib/api/services/conferenciaPatio";
import { useSaidaConferencia } from "./useSaidaConferencia";

const item = fromConferenciaResponse(conferenciaAberta).itens[2];

const registrada: SaidaRegistrada = {
  patioId: item.patioId,
  placa: item.placa,
  dataHoraEntrada: "2026-10-17T10:33:13",
  dataHoraSaida: "2026-11-04T12:00:00",
  minutosPermanencia: 100,
  valor: 0,
  formaPagamento: 1,
  tokenRecibo: "ABCD1234",
};

const onConcluida = vi.fn();

function renderSaida() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const invalidar = vi.spyOn(queryClient, "invalidateQueries");
  const hook = renderHook(() => useSaidaConferencia({ conferenciaId: 1, item, onConcluida }), { wrapper });
  return { invalidar, ...hook };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(darSaidaPeloItem).mockResolvedValue(registrada);
});

describe("validação do motivo", () => {
  it("só confirma com motivo e, no 'Outro', com descrição", () => {
    const { result } = renderSaida();
    expect(result.current.podeConfirmar).toBe(false);
    expect(result.current.erros.motivo).toBeDefined();

    act(() => result.current.setMotivo(String(MOTIVO_SAIDA.Outro)));
    expect(result.current.podeConfirmar).toBe(false);
    expect(result.current.erros.descricao).toBe("Descreva o motivo");

    act(() => result.current.setDescricao("Saiu na troca de turno"));
    expect(result.current.podeConfirmar).toBe(true);
  });
});

describe("confirmar", () => {
  it("envia o motivo e a descrição, avisa e invalida os dados", async () => {
    const { result, invalidar } = renderSaida();
    act(() => {
      result.current.setMotivo(String(MOTIVO_SAIDA.Outro));
      result.current.setDescricao("Saiu na troca de turno");
    });

    await act(async () => {
      result.current.confirmar();
    });

    await waitFor(() => expect(onConcluida).toHaveBeenCalled());
    expect(darSaidaPeloItem).toHaveBeenCalledWith(1, item.patioConferenciaItemId, {
      valor: 0,
      formaPagamento: 1,
      motivo: MOTIVO_SAIDA.Outro,
      descricao: "Saiu na troca de turno",
    });
    const chaves = invalidar.mock.calls.map(([filtro]) => (filtro as { queryKey: readonly string[] }).queryKey[0]);
    expect(chaves).toEqual(expect.arrayContaining(["conferencia-patio", "patio", "quadros-chaves", "caixa"]));
  });

  it("não envia a descrição nos motivos que não são 'Outro'", async () => {
    const { result } = renderSaida();
    act(() => {
      result.current.setMotivo(String(MOTIVO_SAIDA.SaiuSemBaixa));
      result.current.setDescricao("texto que sobrou");
    });

    await act(async () => {
      result.current.confirmar();
    });

    await waitFor(() => expect(darSaidaPeloItem).toHaveBeenCalled());
    expect(vi.mocked(darSaidaPeloItem).mock.calls[0][2]).toEqual({ valor: 0, formaPagamento: 1, motivo: 1 });
  });

  it("erro do servidor: expõe a mensagem e não avisa", async () => {
    vi.mocked(darSaidaPeloItem).mockRejectedValue(new ApiError("validation", "Abra o caixa para dar saída.", 400));
    const { result } = renderSaida();
    act(() => result.current.setMotivo("1"));

    await act(async () => {
      result.current.confirmar();
    });

    await waitFor(() => expect(result.current.erroRegistro).toBe("Abra o caixa para dar saída."));
    expect(onConcluida).not.toHaveBeenCalled();
    expect(result.current.enviando).toBe(false);
  });

  it("sem motivo não envia", async () => {
    const { result } = renderSaida();
    await act(async () => {
      result.current.confirmar();
    });
    expect(darSaidaPeloItem).not.toHaveBeenCalled();
  });
});
