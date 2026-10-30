import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { CaixaFechado } from "./CaixaFechado";

beforeEach(() => {
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("CaixaFechado", () => {
  it("avisa que não há caixa aberto e oferece abrir", async () => {
    const onAbrir = vi.fn();
    renderWithTheme(<CaixaFechado onAbrir={onAbrir} />);

    expect(screen.getByText("Caixa fechado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Abrir caixa" }));
    expect(onAbrir).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["Administrador", 1],
    ["Gerente", 2],
  ])("%s vê o link dos caixas anteriores", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderWithTheme(<CaixaFechado onAbrir={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Caixas anteriores" })).toHaveAttribute("href", "/caixa/historico");
    // Em tela grande o botão assume o lugar do link; display:none no jsdom, então acha-se pelo texto.
    expect(screen.getByText("Ver Histórico").closest("a")).toHaveAttribute("href", "/caixa/historico");
  });

  it.each([
    ["Caixa", 4],
    ["Manobrista", 3],
  ])("%s não vê o link dos caixas anteriores", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderWithTheme(<CaixaFechado onAbrir={vi.fn()} />);

    expect(screen.queryByRole("link", { name: "Caixas anteriores" })).not.toBeInTheDocument();
    expect(screen.queryByText("Ver Histórico")).not.toBeInTheDocument();
  });
});
