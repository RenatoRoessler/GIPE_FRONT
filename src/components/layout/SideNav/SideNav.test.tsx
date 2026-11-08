import { screen, within } from "@testing-library/react";
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
      "Visão Geral",
      "Pátio",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Conferência de pátio",
      "Financeiro",
      "Caixa",
      "Faturas",
      "Notas Fiscais",
      "Minha Empresa",
      "Gestão de Preços",
      "Quadros de Chaves",
      "Mensalistas",
      "Gestão de Usuários",
      "Empresas conveniadas",
    ]);
  });

  it("só mostra o que o perfil pode abrir", () => {
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    renderWithTheme(<SideNav />);

    expect(nomes()).toEqual(["Visão Geral", "Financeiro", "Faturas", "Notas Fiscais"]);
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

describe("SideNav: grupos", () => {
  const nomesDoGrupo = (titulo: string) => within(screen.getByRole("list", { name: titulo, ...opcoes })).getAllByRole("listitem", opcoes).map((item) => item.textContent);

  it("o Administrador vê Operação, Financeiro e Configurações, nessa ordem, cada um com os seus itens", () => {
    renderWithTheme(<SideNav />);

    expect(nomesDoGrupo("Operação")).toEqual(["Pátio", "Entrada de Veículos", "Saída de Veículos", "Conferência de pátio"]);
    expect(nomesDoGrupo("Financeiro")).toEqual(["Financeiro", "Caixa", "Faturas", "Notas Fiscais"]);
    expect(nomesDoGrupo("Configurações")).toEqual(["Minha Empresa", "Gestão de Preços", "Quadros de Chaves", "Mensalistas", "Gestão de Usuários", "Empresas conveniadas"]);
    const titulos = Array.from(document.querySelectorAll('nav[aria-label="Menu lateral"] [id]')).map((titulo) => titulo.textContent);
    expect(titulos).toEqual(["Operação", "Financeiro", "Configurações"]);
  });

  it("a Visão Geral abre o menu, fora dos grupos e sem título", () => {
    renderWithTheme(<SideNav />);

    const primeiro = document.querySelector('nav[aria-label="Menu lateral"] ul > li')!;
    expect(within(primeiro as HTMLElement).getByRole("link", { name: "Visão Geral", ...opcoes })).toHaveAttribute("href", "/dashboard");
    expect(within(primeiro as HTMLElement).queryByRole("list", { name: /./, ...opcoes })).not.toBeInTheDocument();
    for (const titulo of ["Operação", "Financeiro", "Configurações"]) {
      expect(nomesDoGrupo(titulo)).not.toContain("Visão Geral");
    }
  });

  it("os títulos ficam no DOM, para o leitor de tela lê-los com o menu recolhido, e não são cabeçalhos", () => {
    renderWithTheme(<SideNav />);

    expect(screen.getByText("Configurações")).toBeInTheDocument();
    expect(screen.queryByRole("heading", opcoes)).not.toBeInTheDocument();
  });

  it("perfil com poucos itens vê só os grupos que tem, sem título de grupo vazio", () => {
    sessao.atual = { user: { name: "Beto", perfil: 4 }, isLoading: false };
    renderWithTheme(<SideNav />);

    expect(nomesDoGrupo("Operação")).toEqual(["Pátio", "Entrada de Veículos", "Saída de Veículos", "Conferência de pátio"]);
    expect(nomesDoGrupo("Financeiro")).toEqual(["Caixa"]);
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
  });

  it("o Financeiro vê a Visão Geral e só o grupo Financeiro", () => {
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    renderWithTheme(<SideNav />);

    expect(nomes()[0]).toBe("Visão Geral");
    expect(nomesDoGrupo("Financeiro")).toEqual(["Financeiro", "Faturas", "Notas Fiscais"]);
    expect(screen.queryByText("Operação")).not.toBeInTheDocument();
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
  });

  it("a conveniada vê a lista de hoje, sem títulos de grupo", () => {
    sessao.atual = { user: { name: "Lia", perfil: 5 }, isLoading: false };
    renderWithTheme(<SideNav />);

    expect(nomes()).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
    expect(screen.queryByText("Financeiro")).not.toBeInTheDocument();
    expect(screen.queryByText("Operação")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("list", { name: /./, ...opcoes })).toHaveLength(0);
  });

  it("a tela atual fica marcada dentro do seu grupo", () => {
    pathname = "/faturas/12";
    renderWithTheme(<SideNav />);

    const financeiro = within(screen.getByRole("list", { name: "Financeiro", ...opcoes }));
    expect(financeiro.getByRole("link", { name: "Faturas", ...opcoes })).toHaveAttribute("aria-current", "page");
    expect(within(screen.getByRole("list", { name: "Operação", ...opcoes })).queryByRole("link", { current: "page", ...opcoes })).not.toBeInTheDocument();
  });

  it("não mostra grupo nenhum enquanto a sessão carrega", () => {
    sessao.atual = { user: null, isLoading: true };
    renderWithTheme(<SideNav />);

    expect(screen.queryByText("Financeiro")).not.toBeInTheDocument();
  });
});
