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
    <CaixaHeader caixa={caixa} turnoPronto onSangria={vi.fn()} onPassarTurno={vi.fn()} onHistorico={vi.fn()} onFechar={vi.fn()} />,
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
  ])("%s vê retirada e histórico", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderHeader();

    expect(botoes()).toEqual(["Retirada", "Passar turno", "Histórico de turnos", "Fechar caixa"]);
  });

  it("o Caixa faz retirada, mas não vê o histórico", () => {
    sessao.atual = { user: { name: "Caio", perfil: 4 }, isLoading: false };
    renderHeader();

    expect(botoes()).toEqual(["Retirada", "Passar turno", "Fechar caixa"]);
  });

  it("o Manobrista não faz retirada nem vê o histórico, e segue passando e fechando o turno", () => {
    sessao.atual = { user: { name: "Joao", perfil: 3 }, isLoading: false };
    renderHeader();

    expect(botoes()).toEqual(["Passar turno", "Fechar caixa"]);
  });

  it("enquanto o perfil carrega, as ações restritas não aparecem", () => {
    sessao.atual = { user: null, isLoading: true };
    renderHeader();

    expect(botoes()).toEqual(["Passar turno", "Fechar caixa"]);
  });
});
