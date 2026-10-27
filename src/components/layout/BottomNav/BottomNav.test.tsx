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

describe("BottomNav: itens da barra", () => {
  it("em tela estreita mostra os itens prioritários e o Mais", () => {
    renderWithTheme(<BottomNav />);

    const nomes = Array.from(screen.getByRole("navigation", { name: "Navegação principal" }).querySelectorAll("a, button")).map((item) => item.textContent);
    expect(nomes).toEqual(["Início", "Entrada", "Saída", "Pátio", "Mais"]);
  });

  it("quando todos os itens cabem, mostra todos e não oferece o Mais", () => {
    barra.capacidade = 11;
    renderWithTheme(<BottomNav />);

    expect(screen.getAllByRole("link")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Entrada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saída" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mais" })).not.toBeInTheDocument();
    expect(itensDoPainel()).toEqual([]);
  });

  it("nunca usa menos de três espaços, mesmo com a barra mais estreita", () => {
    barra.capacidade = 0;
    renderWithTheme(<BottomNav />);

    const nomes = Array.from(screen.getByRole("navigation", { name: "Navegação principal" }).querySelectorAll("a, button")).map((item) => item.textContent);
    expect(nomes).toEqual(["Início", "Entrada", "Mais"]);
  });

  it("enquanto a largura não foi medida, mostra só espaços reservados", () => {
    barra.capacidade = null;
    renderWithTheme(<BottomNav />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" }).querySelectorAll("a, button")).toHaveLength(0);
  });

  it("enquanto o perfil não é conhecido, não mostra nenhum atalho nem o Mais", () => {
    sessao.atual = { user: null, isLoading: true };
    renderWithTheme(<BottomNav />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" }).querySelectorAll("a, button")).toHaveLength(0);
  });

  it("quem não opera o pátio (Financeiro) vê só os itens que pode abrir, sem Mais", () => {
    sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };
    renderWithTheme(<BottomNav />);

    expect(screen.getByRole("link", { name: "Início" })).toBeInTheDocument();
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
    expect(itensDoPainel()).toEqual(["Caixa", "Gestão de Preços", "Gestão de Usuários", "Mensalistas", "Notas Fiscais", "Minha Empresa"]);
  });

  it("mostra o nome completo dos itens, não o rótulo curto", async () => {
    barra.capacidade = 3;
    await abrir();

    expect(itensDoPainel()).toContain("Saída de Veículos");
    expect(itensDoPainel()).toContain("Gestão de Preços");
    expect(itensDoPainel()).not.toContain("Início");
    expect(itensDoPainel()).not.toContain("Entrada de Veículos");
  });

  it("o painel mostra só as telas que o perfil pode abrir", async () => {
    sessao.atual = { user: { name: "Joao", perfil: 3 }, isLoading: false };
    barra.capacidade = 4;
    await abrir();

    expect(itensDoPainel()).toEqual(["Pátio", "Caixa"]);
  });

  it("Entrada e Saída, quando não cabem na barra, são botões no painel, não links", async () => {
    barra.capacidade = 3;
    await abrir();

    expect(within(painel()).queryByRole("link", { name: "Saída de Veículos", ...opcoes })).not.toBeInTheDocument();
    const saida = within(painel()).getByRole("button", { name: "Saída de Veículos", ...opcoes });
    expect(saida).toHaveAttribute("aria-haspopup", "dialog");
    expect(saida).not.toHaveAttribute("aria-current");
  });

  it("tocar em Saída no painel fecha o painel e só depois abre o modal; o foco volta ao Mais", async () => {
    barra.capacidade = 3;
    const { user } = await abrir();
    // No instante em que o modal é pedido, o painel já não pode estar aberto.
    let painelAbertoNaAbertura: boolean | null = null;
    modais.abrirSaida.mockImplementation(() => {
      painelAbertoNaAbertura = painel().hasAttribute("open");
    });

    await user.click(within(painel()).getByRole("button", { name: "Saída de Veículos", ...opcoes }));

    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
    expect(painelAbertoNaAbertura).toBe(false);
    expect(painel()).not.toHaveAttribute("open");
    expect(modais.abrirEntrada).not.toHaveBeenCalled();
    expect(maisButton()).toHaveFocus();
  });

  it("fechar o painel sem escolher nada nunca abre modal, nem depois de uma ação anterior", async () => {
    barra.capacidade = 3;
    const { user } = await abrir();
    await user.click(within(painel()).getByRole("button", { name: "Saída de Veículos", ...opcoes }));
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);

    await user.click(maisButton());
    await user.click(within(painel()).getByRole("button", { name: "Fechar menu", ...opcoes }));
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
    expect(modais.abrirEntrada).not.toHaveBeenCalled();
  });

  it("marca a tela atual no painel, e só ela", async () => {
    pathname = "/caixa";
    await abrir();

    const links = within(painel()).getAllByRole("link", opcoes);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual(["Caixa"]);
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
    await user.click(within(painel()).getByRole("link", { name: "Caixa", ...opcoes }));
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

  it("continua aberto, só com menos itens, quando a barra passa a comportar mais um item", async () => {
    const { rerender } = await abrir();

    barra.capacidade = 6;
    rerender(<BottomNav />);

    expect(painel()).toHaveAttribute("open");
    expect(itensDoPainel()).toEqual(["Gestão de Preços", "Gestão de Usuários", "Mensalistas", "Notas Fiscais", "Minha Empresa"]);
  });

  it("fecha quando a tela cresce e tudo passa a caber na barra, e o foco vai para a barra", async () => {
    const { rerender } = await abrir();

    barra.capacidade = 11;
    rerender(<BottomNav />);

    expect(painel()).not.toHaveAttribute("open");
    expect(screen.queryByRole("button", { name: "Mais" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveFocus();
  });
});

describe("BottomNav: Mais destacado", () => {
  it("fica apagado quando a tela atual é o Início ou outro item que cabe na barra", () => {
    for (const rota of ["/dashboard", "/patio"]) {
      pathname = rota;
      const { unmount } = renderWithTheme(<BottomNav />);
      expect(maisButton()).toHaveStyle({ color: lightTheme.colors.textMuted });
      unmount();
    }
  });

  it("é destacado quando a tela atual é um item que não coube na barra", () => {
    for (const rota of ["/caixa", "/mensalistas/novo", "/minha-empresa"]) {
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

  it("some junto com o botão quando tudo cabe, e a tela atual fica destacada na própria barra", () => {
    barra.capacidade = 11;
    pathname = "/caixa";
    renderWithTheme(<BottomNav />);

    expect(screen.queryByRole("button", { name: "Mais" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Caixa" })).toHaveAttribute("aria-current", "page");
  });
});
