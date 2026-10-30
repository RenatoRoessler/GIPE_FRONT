import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

let pathname = "/patio";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
const sessao = vi.hoisted(() => ({ atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));
const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => modais }));

import { SideNav } from "./SideNav";

// Fora de telas grandes o menu lateral é escondido por CSS (e o jsdom não casa a media query): as consultas incluem o que está oculto.
const opcoes = { hidden: true } as const;

beforeEach(() => {
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
  pathname = "/patio";
  modais.abrirEntrada.mockReset();
  modais.abrirSaida.mockReset();
});

const nomes = () => Array.from(document.querySelector('nav[aria-label="Menu lateral"]')!.querySelectorAll("li > a, li > button")).map((item) => item.textContent);

describe("SideNav", () => {
  it("lista todos os itens do perfil, com o nome completo e na ordem do menu", () => {
    renderWithTheme(<SideNav />);

    expect(nomes()).toEqual([
      "Pátio",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Caixa",
      "Dashboard",
      "Gestão de Preços",
      "Gestão de Usuários",
      "Mensalistas",
      "Empresas conveniadas",
      "Notas Fiscais",
      "Financeiro",
      "Minha Empresa",
      "Quadros de Chaves",
    ]);
  });

  it("só mostra o que o perfil pode abrir", () => {
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    renderWithTheme(<SideNav />);

    expect(nomes()).toEqual(["Dashboard", "Notas Fiscais", "Financeiro"]);
  });

  it("não mostra itens enquanto a sessão carrega", () => {
    sessao.atual = { user: null, isLoading: true };
    renderWithTheme(<SideNav />);

    expect(nomes()).toEqual([]);
  });

  it("marca só a tela atual", () => {
    pathname = "/caixa/detalhe";
    renderWithTheme(<SideNav />);

    const atuais = screen.getAllByRole("link", opcoes).filter((link) => link.getAttribute("aria-current") === "page");
    expect(atuais.map((link) => link.textContent)).toEqual(["Caixa"]);
  });

  it("Entrada e Saída são botões que abrem o modal, nunca links", async () => {
    renderWithTheme(<SideNav />);
    const user = userEvent.setup();

    expect(screen.queryByRole("link", { name: "Entrada de Veículos", ...opcoes })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entrada de Veículos", ...opcoes }));
    await user.click(screen.getByRole("button", { name: "Saída de Veículos", ...opcoes }));

    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
  });
});
