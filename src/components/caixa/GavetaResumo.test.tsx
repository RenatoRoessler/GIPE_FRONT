import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Caixa, Turno } from "@/types/caixa";

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { GavetaResumo } from "./GavetaResumo";

const caixa: Caixa = {
  caixaId: 1,
  dataHoraAbertura: "2026-10-23T08:00:00",
  valorFundoCaixa: 100,
  valorTotalEntrada: 500,
  valorTotalSaida: 120,
  saldoAtual: 380,
};

function turno(extra: Partial<Turno> = {}): Turno {
  return {
    turnoId: 1,
    caixaId: 1,
    usuarioId: 1,
    usuario: "Ana",
    usuarioIdFechamento: null,
    dataHoraInicio: "2026-10-23T08:00:00",
    dataHoraFim: null,
    valorFundoCaixa: 100,
    status: 1,
    saldoCaixa: 380,
    totalEntradas: 500,
    totalSaidas: 120,
    totalSaida: null,
    saldoCaixaInformado: null,
    totalDiferenca: null,
    observacao: null,
    disponivelSangria: 300,
    formasPagamento: [{ formaPagamento: 1, entradas: 400, saidas: 100, valorEsperado: 300, valorInformado: null, diferenca: null }],
    ...extra,
  };
}

beforeEach(() => {
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("GavetaResumo", () => {
  it("destaca o dinheiro na gaveta e divide entre o que fica e o que pode retirar", () => {
    renderWithTheme(<GavetaResumo caixa={caixa} turno={turno()} onRetirada={vi.fn()} />);

    expect(screen.getByText("Na gaveta agora")).toBeInTheDocument();
    expect(screen.getByText("R$ 400,00")).toBeInTheDocument();
    expect(screen.getByText(/Fundo de caixa, fica na gaveta/).closest("div")).toHaveTextContent("R$ 100,00");
    expect(screen.getByText("Pode retirar").closest("div")).toHaveTextContent("R$ 300,00");
  });

  it("mostra entradas, saídas e saldo do caixa como a API entrega", () => {
    renderWithTheme(<GavetaResumo caixa={caixa} turno={turno()} onRetirada={vi.fn()} />);

    expect(screen.getByText("Entradas").closest("div")).toHaveTextContent("R$ 500,00");
    expect(screen.getByText("Saídas").closest("div")).toHaveTextContent("R$ 120,00");
    expect(screen.getByText("Saldo do caixa").closest("div")).toHaveTextContent("R$ 380,00");
  });

  it("sem saldo da API calcula entradas menos saídas, sem somar o fundo", () => {
    renderWithTheme(<GavetaResumo caixa={{ ...caixa, saldoAtual: undefined }} turno={turno()} onRetirada={vi.fn()} />);

    expect(screen.getByText("Saldo do caixa").closest("div")).toHaveTextContent("R$ 380,00");
  });

  it("o botão Retirada aparece para quem pode e chama a ação", async () => {
    const onRetirada = vi.fn();
    renderWithTheme(<GavetaResumo caixa={caixa} turno={turno()} onRetirada={onRetirada} />);

    await userEvent.click(screen.getByRole("button", { name: "Retirada" }));

    expect(onRetirada).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Manobrista", 3],
    ["Financeiro", 8],
  ])("%s não vê o botão Retirada, mas vê o que pode retirar", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderWithTheme(<GavetaResumo caixa={caixa} turno={turno()} onRetirada={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Retirada" })).not.toBeInTheDocument();
    expect(screen.getByText("Pode retirar").closest("div")).toHaveTextContent("R$ 300,00");
  });

  it("sem os dados da API mostra traço em vez de inventar o total", () => {
    renderWithTheme(<GavetaResumo caixa={caixa} turno={turno({ formasPagamento: [], disponivelSangria: null })} onRetirada={vi.fn()} />);

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("carregando mostra o estado de espera", () => {
    renderWithTheme(<GavetaResumo caixa={caixa} turno={undefined} onRetirada={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando a gaveta");
  });

  it("sem turno aberto avisa e ainda mostra os totais do caixa", () => {
    renderWithTheme(<GavetaResumo caixa={caixa} turno={null} onRetirada={vi.fn()} />);

    expect(screen.getByText("Sem turno aberto")).toBeInTheDocument();
    expect(screen.getByText("Entradas").closest("div")).toHaveTextContent("R$ 500,00");
    expect(screen.queryByText("Na gaveta agora")).not.toBeInTheDocument();
  });
});
