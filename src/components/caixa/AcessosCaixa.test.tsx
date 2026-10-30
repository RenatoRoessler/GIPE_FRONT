import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { AcessosCaixa } from "./AcessosCaixa";

// Em tela pequena os acessos ficam display:none (o jsdom não aplica o breakpoint e os tira da árvore de acessibilidade): acham-se pelo texto.
const acesso = (texto: string) => screen.queryByText(texto)?.closest("a") ?? null;

beforeEach(() => {
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("AcessosCaixa", () => {
  it.each([
    ["Administrador", 1],
    ["Gerente", 2],
  ])("%s vê o histórico e os movimentos, nesta ordem", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderWithTheme(<AcessosCaixa />);

    expect(acesso("Ver Histórico")).toHaveAttribute("href", "/caixa/historico");
    expect(acesso("Ver movimentos")).toHaveAttribute("href", "/caixa/movimentos");
    expect(acesso("Ver Histórico")!.compareDocumentPosition(acesso("Ver movimentos")!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each([
    ["Caixa", 4],
    ["Manobrista", 3],
  ])("%s vê só os movimentos", (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    renderWithTheme(<AcessosCaixa />);

    expect(acesso("Ver Histórico")).toBeNull();
    expect(acesso("Ver movimentos")).toHaveAttribute("href", "/caixa/movimentos");
  });
});
