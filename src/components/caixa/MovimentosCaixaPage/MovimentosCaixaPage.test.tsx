import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Caixa, Movimento } from "@/types/caixa";

const caixa = vi.hoisted(() => ({ atual: {} as Record<string, unknown> }));
vi.mock("../useCaixa", () => ({ useCaixa: () => caixa.atual, CAIXA_KEY: ["caixa"] }));

import { MovimentosCaixaPage } from "./MovimentosCaixaPage";

const consulta = (extra: Record<string, unknown>) => ({
  isPending: false,
  isError: false,
  isFetching: false,
  data: undefined,
  error: null,
  refetch: vi.fn(),
  ...extra,
});

const aberto: Caixa = { caixaId: 1, dataHoraAbertura: "2026-10-23T08:00:00", valorFundoCaixa: 100, valorTotalEntrada: 500, valorTotalSaida: 120 };

let seq = 1;
function mov(extra: Partial<Movimento> = {}): Movimento {
  return { movimentoId: seq++, dataHora: "2026-10-23T09:00:00", tipo: "entrada", valor: 100, formaPagamento: 1, turnoId: 4, usuario: "renato teste", motivo: null, ...extra };
}

// Na ordem em que a API devolve hoje (já do mais novo para o mais antigo), embaralhada de propósito.
const movimentos = [
  mov({ movimentoId: 27, dataHora: "2026-10-23T18:35:23", valor: 18100, usuario: "Primeiro" }),
  mov({ movimentoId: 33, dataHora: "2026-10-29T18:41:57", valor: 15, usuario: "Terceiro" }),
  mov({ movimentoId: 28, dataHora: "2026-10-23T18:35:47", tipo: "sangria", valor: 100, motivo: "compra de material de limpeza", usuario: "Segundo" }),
];

function abrir(extra: Record<string, unknown> = {}) {
  caixa.atual = {
    caixaQuery: consulta({ data: aberto }),
    caixa: aberto,
    turnoQuery: consulta({}),
    movimentosQuery: consulta({ data: movimentos }),
    ...extra,
  };
}

beforeEach(() => {
  caixa.atual = {};
});

describe("MovimentosCaixaPage", () => {
  it("lista do mais recente para o mais antigo, sem alterar a lista original", () => {
    abrir();
    renderWithProviders(<MovimentosCaixaPage />);

    const linhas = screen.getAllByRole("row").slice(1);
    expect(linhas[0]).toHaveTextContent("Terceiro");
    expect(linhas[1]).toHaveTextContent("Segundo");
    expect(linhas[2]).toHaveTextContent("Primeiro");
    expect(movimentos.map((m) => m.movimentoId)).toEqual([27, 33, 28]);
  });

  it("resume abertura, entradas e saídas, e volta ao caixa", () => {
    abrir();
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Movimentos do caixa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao caixa" })).toHaveAttribute("href", "/caixa");
    const resumo = screen.getByLabelText("Resumo do caixa");
    expect(within(resumo).getByText("Entradas").nextSibling).toHaveTextContent("R$ 18.115,00");
    expect(within(resumo).getByText("Saídas e retiradas").nextSibling).toHaveTextContent("R$ 100,00");
  });

  it("enquanto o caixa carrega mostra o esqueleto", () => {
    caixa.atual = { caixaQuery: consulta({ isPending: true }), caixa: null, movimentosQuery: consulta({}) };
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando caixa");
  });

  it("enquanto os movimentos carregam mostra a abertura, sem totais", () => {
    abrir({ movimentosQuery: consulta({ isPending: true }) });
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByText("Aberto em")).toBeInTheDocument();
    expect(screen.queryByText("Entradas", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando movimentos");
  });

  it("sem movimentos avisa que o caixa ainda não tem nenhum", () => {
    abrir({ movimentosQuery: consulta({ data: [] }) });
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByText("Ainda não há movimentos neste caixa.")).toBeInTheDocument();
  });

  it("erro nos movimentos mostra a mensagem e refaz a consulta", async () => {
    const refetch = vi.fn();
    abrir({ movimentosQuery: consulta({ isError: true, error: new ApiError("server"), refetch }) });
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("erro do caixa oferece nova tentativa", async () => {
    const refetch = vi.fn();
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("server"), refetch }), caixa: null, movimentosQuery: consulta({}) };
    renderWithProviders(<MovimentosCaixaPage />);

    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("no 403 avisa da permissão", () => {
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("forbidden") }), caixa: null, movimentosQuery: consulta({}) };
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
  });

  it("sem caixa aberto avisa e leva ao caixa", () => {
    caixa.atual = { caixaQuery: consulta({ data: null }), caixa: null, movimentosQuery: consulta({}) };
    renderWithProviders(<MovimentosCaixaPage />);

    expect(screen.getByText("Não há caixa aberto.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o caixa" })).toHaveAttribute("href", "/caixa");
  });
});
