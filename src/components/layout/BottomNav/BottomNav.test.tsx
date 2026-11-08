import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
const sessao = vi.hoisted(() => ({ atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));
const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => modais }));
// A largura real não existe no jsdom: o teste escolhe quantos espaços cabem na barra.
const barra = vi.hoisted(() => ({ capacidade: 5 as number | null }));
vi.mock("./useBarCapacity", () => ({ useBarCapacity: () => ({ ref: vi.fn(), capacidade: barra.capacidade }) }));

import { BottomNav } from "./BottomNav";

// Fechado, o painel é escondido pelo navegador e fora da árvore de acessibilidade.
const opcoes = { hidden: true } as const;

// jsdom não implementa <dialog>: showModal/close só alternam o atributo, e close avisa como o navegador faz.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
  pathname = "/dashboard";
  barra.capacidade = 5;
  modais.abrirEntrada.mockReset();
  modais.abrirSaida.mockReset();
});

const maisButton = () => screen.getByRole("button", { name: "Mais" });
// Só há um painel; ele é <dialog>.
const painel = () => screen.getByRole("dialog", opcoes) as HTMLDialogElement;
const itensDoPainel = () => Array.from(painel().querySelectorAll("li > a, li > button")).map((item) => item.textContent);

async function abrir() {
  const user = userEvent.setup();
  const view = renderWithTheme(<BottomNav />);
  await user.click(maisButton());
  return { user, ...view };
}

const nomesDaBarra = () => Array.from(screen.getByRole("navigation", { name: "Navegação principal" }).querySelectorAll("a, button")).map((item) => item.textContent);
const TODOS_DO_PAINEL = ["Conferência de pátio", "Dashboard", "Gestão de Preços", "Gestão de Usuários", "Mensalistas", "Empresas conveniadas", "Faturas", "Notas Fiscais", "Financeiro", "Minha Empresa", "Quadros de Chaves"];

describe("BottomNav: itens da barra", () => {
  it("perfil operacional: Pátio, Caixa, Entrada, Saída e Mais, com a Entrada no centro", () => {
    renderWithTheme(<BottomNav />);

    expect(nomesDaBarra()).toEqual(["Pátio", "Caixa", "Entrada", "Saída", "Mais"]);
  });

  it("a ordem e as cinco posições são as mesmas em tela larga: o resto vai para o Mais", () => {
    barra.capacidade = 14;
    renderWithTheme(<BottomNav />);

    expect(nomesDaBarra()).toEqual(["Pátio", "Caixa", "Entrada", "Saída", "Mais"]);
    expect(itensDoPainel()).toEqual(TODOS_DO_PAINEL);
  });

  it("a ordem é a mesma mesmo com a barra mais estreita que cinco espaços", () => {
    barra.capacidade = 0;
    renderWithTheme(<BottomNav />);

    expect(nomesDaBarra()).toEqual(["Pátio", "Caixa", "Entrada", "Saída", "Mais"]);
  });

  it("a barra de cinco posições não espera a medição da largura", () => {
    barra.capacidade = null;
    renderWithTheme(<BottomNav />);

    expect(nomesDaBarra()).toEqual(["Pátio", "Caixa", "Entrada", "Saída", "Mais"]);
  });

  it("perfil sem o pátio mantém a barra adaptativa e espera a medição da largura", () => {
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    barra.capacidade = null;
    renderWithTheme(<BottomNav />);

    expect(nomesDaBarra()).toEqual([]);
  });

  it("perfil da conveniada usa a barra adaptativa, sem o botão de Entrada", () => {
    sessao.atual = { user: { name: "Lia", perfil: 5 }, isLoading: false };
    renderWithTheme(<BottomNav />);

    expect(screen.queryByRole("button", { name: "Entrada" })).not.toBeInTheDocument();
    expect(nomesDaBarra()).not.toContain("Caixa");
  });

  it("enquanto o perfil não é conhecido, não mostra nenhum atalho nem o Mais", () => {
    sessao.atual = { user: null, isLoading: true };
    renderWithTheme(<BottomNav />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" }).querySelectorAll("a, button")).toHaveLength(0);
  });

  it("quem não opera o pátio (Financeiro) vê só os itens que pode abrir, sem Mais", () => {
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    renderWithTheme(<BottomNav />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Entrada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mais" })).not.toBeInTheDocument();
  });

  it("as abas Entrada e Saída da barra abrem o modal direto, sem abrir o painel", async () => {
    renderWithTheme(<BottomNav />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Entrada" }));
    await user.click(screen.getByRole("button", { name: "Saída" }));

    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
    expect(painel()).not.toHaveAttribute("open");
  });
});

describe("BottomNav: menu estendido", () => {
  it("começa fechado", () => {
    renderWithTheme(<BottomNav />);
    expect(painel()).not.toHaveAttribute("open");
    expect(maisButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("abre só com as telas que não couberam, na ordem do menu", async () => {
    await abrir();

    expect(painel()).toHaveAttribute("open");
    expect(maisButton()).toHaveAttribute("aria-expanded", "true");
    expect(within(painel()).getByRole("heading", { name: "Mais", ...opcoes })).toBeInTheDocument();
    expect(itensDoPainel()).toEqual(["Conferência de pátio", "Dashboard", "Gestão de Preços", "Gestão de Usuários", "Mensalistas", "Empresas conveniadas", "Faturas", "Notas Fiscais", "Financeiro", "Minha Empresa", "Quadros de Chaves"]);
  });

  it("mostra o nome completo dos itens, não o rótulo curto", async () => {
    barra.capacidade = 3;
    await abrir();

    expect(itensDoPainel()).toContain("Dashboard");
    expect(itensDoPainel()).toContain("Gestão de Preços");
    expect(itensDoPainel()).not.toContain("Pátio");
    expect(itensDoPainel()).not.toContain("Entrada de Veículos");
  });

  it("o painel mostra só as telas que o perfil pode abrir", async () => {
    sessao.atual = { user: { name: "Joao", perfil: 2 }, isLoading: false };
    barra.capacidade = 4;
    await abrir();

    expect(itensDoPainel()).toEqual(["Conferência de pátio", "Dashboard", "Gestão de Preços", "Mensalistas", "Faturas", "Notas Fiscais", "Financeiro", "Quadros de Chaves"]);
  });

  it("marca a tela atual no painel, e só ela", async () => {
    pathname = "/dashboard";
    await abrir();

    const links = within(painel()).getAllByRole("link", opcoes);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual(["Dashboard"]);
  });

  it("fecha no botão de fechar e devolve o foco ao botão Mais", async () => {
    const { user } = await abrir();
    await user.click(within(painel()).getByRole("button", { name: "Fechar menu", ...opcoes }));

    expect(painel()).not.toHaveAttribute("open");
    expect(maisButton()).toHaveAttribute("aria-expanded", "false");
    expect(maisButton()).toHaveFocus();
  });

  it("fecha ao tocar no fundo, mas não ao tocar no conteúdo", async () => {
    const { user } = await abrir();

    await user.click(within(painel()).getByRole("heading", { name: "Mais", ...opcoes }));
    expect(painel()).toHaveAttribute("open");

    await user.click(painel());
    expect(painel()).not.toHaveAttribute("open");
  });

  it("fecha ao escolher uma tela", async () => {
    const { user } = await abrir();
    await user.click(within(painel()).getByRole("link", { name: "Dashboard", ...opcoes }));
    expect(painel()).not.toHaveAttribute("open");
  });

  it("fecha quando o navegador fecha o painel por conta própria (Esc) e volta o foco ao Mais", async () => {
    await abrir();
    // O Esc nativo fecha o <dialog> e dispara `close`; o jsdom não faz isso, então simulamos o resultado.
    act(() => painel().close());

    expect(maisButton()).toHaveAttribute("aria-expanded", "false");
    expect(maisButton()).toHaveFocus();
  });

  it("fecha quando a rota muda", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithTheme(<BottomNav />);
    await user.click(maisButton());
    expect(painel()).toHaveAttribute("open");

    pathname = "/patio";
    rerender(<BottomNav />);
    expect(painel()).not.toHaveAttribute("open");
  });

  it("continua aberto, com os mesmos itens, quando a largura da barra muda", async () => {
    const { rerender } = await abrir();

    barra.capacidade = 9;
    rerender(<BottomNav />);

    expect(painel()).toHaveAttribute("open");
    expect(itensDoPainel()).toEqual(TODOS_DO_PAINEL);
  });
});

describe("BottomNav: Mais destacado", () => {
  it("fica apagado quando a tela atual é o Pátio ou outro item que cabe na barra", () => {
    for (const rota of ["/caixa", "/patio"]) {
      pathname = rota;
      const { unmount } = renderWithTheme(<BottomNav />);
      expect(maisButton()).toHaveStyle({ color: lightTheme.colors.textMuted });
      unmount();
    }
  });

  it("é destacado quando a tela atual é um item que não coube na barra", () => {
    for (const rota of ["/dashboard", "/mensalistas/novo", "/minha-empresa"]) {
      pathname = rota;
      const { unmount } = renderWithTheme(<BottomNav />);
      expect(maisButton()).toHaveStyle({ color: lightTheme.colors.text });
      unmount();
    }
  });

  it("é destacado enquanto o painel está aberto", async () => {
    await abrir();
    expect(maisButton()).toHaveStyle({ color: lightTheme.colors.text });
  });

  it("a tela atual fica destacada na própria barra", () => {
    pathname = "/caixa";
    renderWithTheme(<BottomNav />);

    expect(screen.getByRole("link", { name: "Caixa" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pátio" })).not.toHaveAttribute("aria-current");
  });
});
