import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/services/caixa", () => ({
  getCaixa: vi.fn(),
  getTurnoAtual: vi.fn(),
  listTurnos: vi.fn(),
  listMovimentos: vi.fn(),
  listHistoricoCaixas: vi.fn(),
  listMovimentosCaixa: vi.fn(),
}));

import {
  getCaixa,
  getTurnoAtual,
  listHistoricoCaixas,
  listMovimentos,
  listMovimentosCaixa,
  listTurnos,
} from "@/lib/api/services/caixa";
import { CAIXA_KEY, useCaixa } from "./useCaixa";
import { useHistoricoCaixas } from "./useHistoricoCaixas";
import { useMovimentosCaixa } from "./useMovimentosCaixa";

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const aberto = { caixaId: 1, dataHoraAbertura: "2026-10-23T08:00:00", valorFundoCaixa: 100, valorTotalEntrada: 0, valorTotalSaida: 0 };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useCaixa", () => {
  it("com o caixa aberto busca turno, turnos e movimentos", async () => {
    vi.mocked(getCaixa).mockResolvedValue(aberto);
    vi.mocked(getTurnoAtual).mockResolvedValue(null);
    vi.mocked(listTurnos).mockResolvedValue([]);
    vi.mocked(listMovimentos).mockResolvedValue([]);
    const { wrapper } = setup();

    const { result } = renderHook(() => useCaixa(), { wrapper });

    await waitFor(() => expect(result.current.movimentosQuery.isSuccess).toBe(true));
    expect(result.current.caixa).toEqual(aberto);
    expect(listTurnos).toHaveBeenCalled();
    expect(getTurnoAtual).toHaveBeenCalled();
  });

  it("com o caixa fechado não busca turno, turnos nem movimentos", async () => {
    vi.mocked(getCaixa).mockResolvedValue(null);
    const { wrapper } = setup();

    const { result } = renderHook(() => useCaixa(), { wrapper });

    await waitFor(() => expect(result.current.caixaQuery.isSuccess).toBe(true));
    expect(result.current.caixa).toBeNull();
    expect(listMovimentos).not.toHaveBeenCalled();
    expect(listTurnos).not.toHaveBeenCalled();
    expect(getTurnoAtual).not.toHaveBeenCalled();
  });

  it("invalidar o prefixo do caixa refaz movimentos, turnos e histórico", async () => {
    vi.mocked(getCaixa).mockResolvedValue(aberto);
    vi.mocked(getTurnoAtual).mockResolvedValue(null);
    vi.mocked(listTurnos).mockResolvedValue([]);
    vi.mocked(listMovimentos).mockResolvedValue([]);
    vi.mocked(listHistoricoCaixas).mockResolvedValue({ items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 });
    const { queryClient, wrapper } = setup();
    const caixa = renderHook(() => useCaixa(), { wrapper });
    const historico = renderHook(() => useHistoricoCaixas({ dataInicio: "", dataFim: "", pagina: 1 }), { wrapper });
    await waitFor(() => expect(caixa.result.current.movimentosQuery.isSuccess).toBe(true));
    await waitFor(() => expect(historico.result.current.isSuccess).toBe(true));

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
    });

    expect(listMovimentos).toHaveBeenCalledTimes(2);
    expect(listTurnos).toHaveBeenCalledTimes(2);
    expect(listHistoricoCaixas).toHaveBeenCalledTimes(2);
  });
});

describe("useHistoricoCaixas", () => {
  it("pede o período e a página com 20 por página", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue({ items: [], page: 2, pageSize: 20, totalRecords: 30, totalPages: 2 });
    const { wrapper } = setup();

    const { result } = renderHook(() => useHistoricoCaixas({ dataInicio: "2026-10-01", dataFim: "2026-10-31", pagina: 2 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listHistoricoCaixas).toHaveBeenCalledWith({ dataInicio: "2026-10-01", dataFim: "2026-10-31", pagina: 2, tamanhoPagina: 20 });
  });

  it("mantém a página anterior enquanto carrega a próxima", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, totalRecords: 30, totalPages: 2 });
    const { wrapper } = setup();
    const { result, rerender } = renderHook(({ pagina }) => useHistoricoCaixas({ dataInicio: "", dataFim: "", pagina }), {
      wrapper,
      initialProps: { pagina: 1 },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    vi.mocked(listHistoricoCaixas).mockReturnValue(new Promise(() => {}));
    rerender({ pagina: 2 });

    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data?.page).toBe(1);
  });
});

describe("useMovimentosCaixa", () => {
  it("busca o extrato do caixa pedido", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue([]);
    const { wrapper } = setup();

    const { result } = renderHook(() => useMovimentosCaixa(12), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listMovimentosCaixa).toHaveBeenCalledWith(12);
  });

  it("id inválido não consulta a API", () => {
    const { wrapper } = setup();

    renderHook(() => useMovimentosCaixa(Number.NaN), { wrapper });

    expect(listMovimentosCaixa).not.toHaveBeenCalled();
  });
});
