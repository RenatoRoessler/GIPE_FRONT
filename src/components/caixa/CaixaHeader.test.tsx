import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Caixa } from "@/types/caixa";

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { CaixaHeader } from "./CaixaHeader";

const caixa = { dataHoraAbertura: "2026-10-23T08:00:00" } as Caixa;

function renderHeader() {
  return renderWithTheme(
    <CaixaHeader caixa={caixa} turnoPronto onPassarTurno={vi.fn()} onHistorico={vi.fn()} onFechar={vi.fn()} />,
  );
}

const botoes = () => screen.getAllByRole("button").map((botao) => botao.textContent);

describe("CaixaHeader: permissão por perfil", () => {
  beforeEach(() => {
    sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
  });

  it.each([
    ["Administrador", 1],
    ["Gerente", 2],
  ])("%s vê o histórico de turnos e o link dos caixas anteriores", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderHeader();

    expect(botoes()).toEqual(["Passar turno", "Histórico de turnos", "Fechar caixa"]);
    expect(screen.getByRole("link", { name: "Caixas anteriores" })).toHaveAttribute("href", "/caixa/historico");
  });

  it("o Caixa vê o histórico de turnos, mas não os caixas anteriores", () => {
    sessao.atual = { user: { name: "Caio", perfil: 4 }, isLoading: false };
    renderHeader();

    expect(botoes()).toEqual(["Passar turno", "Histórico de turnos", "Fechar caixa"]);
    expect(screen.queryByRole("link", { name: "Caixas anteriores" })).not.toBeInTheDocument();
  });

  it("o Manobrista vê o histórico de turnos, mas não os caixas anteriores", () => {
    sessao.atual = { user: { name: "Joao", perfil: 3 }, isLoading: false };
    renderHeader();

    expect(botoes()).toEqual(["Passar turno", "Histórico de turnos", "Fechar caixa"]);
    expect(screen.queryByRole("link", { name: "Caixas anteriores" })).not.toBeInTheDocument();
  });

  it("a retirada não fica no cabeçalho: vive na gaveta, junto do que pode retirar", () => {
    renderHeader();

    expect(screen.queryByRole("button", { name: "Retirada" })).not.toBeInTheDocument();
  });

  it("enquanto o perfil carrega, só aparecem as ações liberadas a todos", () => {
    sessao.atual = { user: null, isLoading: true };
    renderHeader();

    expect(botoes()).toEqual(["Passar turno", "Histórico de turnos", "Fechar caixa"]);
    expect(screen.queryByRole("link", { name: "Caixas anteriores" })).not.toBeInTheDocument();
  });
});
