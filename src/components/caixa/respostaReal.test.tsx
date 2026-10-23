import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Caixa } from "@/types/caixa";

vi.mock("@/lib/api/client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Maria", perfil: 1 }, isLoading: false }) }));

import { api } from "@/lib/api/client";
import { getTurnoAtual } from "@/lib/api/services/caixa";
import { calcularGaveta } from "./gaveta";
import { GavetaResumo } from "./GavetaResumo";
import { TurnoAtual } from "./TurnoAtual";

// Resposta real de GET /Caixa/turno (enviada pelo usuário em 23/10/2026).
const RESPOSTA_TURNO = {
  turnoId: 3,
  caixaId: 3,
  usuarioId: 26,
  usuario: "renato teste",
  dataHoraInicio: "2026-10-23T18:11:45.518191",
  valorFundoCaixa: 0.0,
  totalEntradas: 20.0,
  totalSaidas: 0,
  disponivelSangria: 20.0,
  formasPagamento: [
    { formaPagamento: 1, descricao: "Dinheiro", entradas: 20.0, saidas: 0 },
    { formaPagamento: 2, descricao: "PIX", entradas: 0, saidas: 0 },
    { formaPagamento: 3, descricao: "Cartão de débito", entradas: 0, saidas: 0 },
    { formaPagamento: 4, descricao: "Cartão de crédito", entradas: 0, saidas: 0 },
  ],
};

const caixa: Caixa = { caixaId: 3, dataHoraAbertura: "2026-10-23T18:11:45", valorFundoCaixa: 0, valorTotalEntrada: 20, valorTotalSaida: 0, saldoAtual: 20 };

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

describe("resposta real de GET /Caixa/turno", () => {
  it("vira um turno sem undefined e com o esperado de cada forma calculado", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: RESPOSTA_TURNO });
    const turno = await getTurnoAtual();

    expect(turno).not.toBeNull();
    expect(turno?.valorFundoCaixa).toBe(0);
    expect(turno?.disponivelSangria).toBe(20);
    expect(turno?.saldoCaixa).toBe(20);
    expect(turno?.formasPagamento.map((forma) => [forma.formaPagamento, forma.valorEsperado])).toEqual([
      [1, 20],
      [2, 0],
      [3, 0],
      [4, 0],
    ]);
  });

  it("a gaveta tem 20 na gaveta, 0 de fundo e 20 para retirar", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: RESPOSTA_TURNO });
    const turno = await getTurnoAtual();

    expect(calcularGaveta(turno!)).toEqual({ naGaveta: 20, fica: 0, retiravel: 20 });
  });

  it("a tela mostra R$ 20,00 na gaveta, sem traço nem NaN", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: RESPOSTA_TURNO });
    const turno = await getTurnoAtual();
    renderWithTheme(<GavetaResumo caixa={caixa} turno={turno} onRetirada={vi.fn()} />);

    expect(screen.getByText("Na gaveta agora").closest("section")).toHaveTextContent("R$ 20,00");
    expect(screen.getByText("Pode retirar").closest("div")).toHaveTextContent("R$ 20,00");
    expect(screen.getByText(/Fundo de caixa, fica na gaveta/).closest("div")).toHaveTextContent("R$ 0,00");
    expect(document.body.textContent).not.toMatch(/NaN|undefined/);
  });

  it("o turno atual mostra as quatro formas, sem NaN", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: RESPOSTA_TURNO });
    const turno = await getTurnoAtual();
    renderWithTheme(<TurnoAtual turno={turno} />);

    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/NaN|undefined/);
  });
});
