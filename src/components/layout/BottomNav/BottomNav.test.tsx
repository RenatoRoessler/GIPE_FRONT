import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => modais }));

import { BottomNav } from "./BottomNav";

// A barra e o painel só aparecem abaixo de `breakpoints.lg` por CSS; o jsdom não avalia a media query.
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

// matchMedia também não existe no jsdom: um ouvinte controlável simula a tela crescendo até `lg`.
let mediaListeners: Array<(event: MediaQueryListEvent) => void> = [];

beforeEach(() => {
  pathname = "/dashboard";
  modais.abrirEntrada.mockReset();
  modais.abrirSaida.mockReset();
  mediaListeners = [];
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: (_tipo: string, ouvinte: (event: MediaQueryListEvent) => void) => mediaListeners.push(ouvinte),
    removeEventListener: (_tipo: string, ouvinte: (event: MediaQueryListEvent) => void) => {
      mediaListeners = mediaListeners.filter((item) => item !== ouvinte);
    },
  })) as unknown as typeof window.matchMedia;
});

const menuButton = () => screen.getByRole("button", { name: "Menu", ...opcoes });
// Fechado, o painel é escondido por CSS e o nome acessível (do título dentro dele) não é calculado; só há um painel.
const painel = () => screen.getByRole("dialog", opcoes) as HTMLDialogElement;

async function abrir() {
  const user = userEvent.setup();
  renderWithTheme(<BottomNav />);
  await user.click(menuButton());
  return user;
}

describe("BottomNav: painel do Menu", () => {
  it("começa fechado", () => {
    renderWithTheme(<BottomNav />);
    expect(painel()).not.toHaveAttribute("open");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("abre com todas as telas, na ordem do menu do computador", async () => {
    await abrir();

    expect(painel()).toHaveAttribute("open");
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    // Links e botões de ação (Entrada e Saída), na ordem em que aparecem.
    const itens = Array.from(painel().querySelectorAll("li > a, li > button"));
    expect(itens.map((item) => item.textContent)).toEqual([
      "Início",
      "Gestão de Preços",
      "Gestão de Usuários",
      "Mensalistas",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Pátio",
      "Caixa",
      "Relatórios",
      "Minha Empresa",
    ]);
  });

  it("Entrada e Saída são botões no painel, não links", async () => {
    await abrir();

    expect(within(painel()).queryByRole("link", { name: "Entrada de Veículos", ...opcoes })).not.toBeInTheDocument();
    expect(within(painel()).queryByRole("link", { name: "Saída de Veículos", ...opcoes })).not.toBeInTheDocument();
    const entrada = within(painel()).getByRole("button", { name: "Entrada de Veículos", ...opcoes });
    expect(entrada).toHaveAttribute("aria-haspopup", "dialog");
    expect(entrada).not.toHaveAttribute("aria-current");
  });

  it("tocar em Entrada fecha o painel e só depois abre o modal; o foco fica no botão Menu", async () => {
    const user = await abrir();
    // No instante em que o modal é pedido, o painel já não pode estar aberto.
    let painelAbertoNaAbertura: boolean | null = null;
    modais.abrirEntrada.mockImplementation(() => {
      painelAbertoNaAbertura = painel().hasAttribute("open");
    });

    await user.click(within(painel()).getByRole("button", { name: "Entrada de Veículos", ...opcoes }));

    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(painelAbertoNaAbertura).toBe(false);
    expect(painel()).not.toHaveAttribute("open");
    expect(modais.abrirSaida).not.toHaveBeenCalled();
    expect(menuButton()).toHaveFocus();
  });

  it("tocar em Saída abre o modal de saída", async () => {
    const user = await abrir();
    await user.click(within(painel()).getByRole("button", { name: "Saída de Veículos", ...opcoes }));

    expect(painel()).not.toHaveAttribute("open");
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
    expect(modais.abrirEntrada).not.toHaveBeenCalled();
  });

  it("fechar o painel sem escolher nada nunca abre modal, nem depois de uma ação anterior", async () => {
    const user = await abrir();
    await user.click(within(painel()).getByRole("button", { name: "Entrada de Veículos", ...opcoes }));
    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);

    await user.click(menuButton());
    await user.click(within(painel()).getByRole("button", { name: "Fechar menu", ...opcoes }));
    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).not.toHaveBeenCalled();
  });

  it("as abas Entrada e Saída da barra abrem o modal direto, sem abrir o painel", async () => {
    renderWithTheme(<BottomNav />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Entrada", ...opcoes }));
    await user.click(screen.getByRole("button", { name: "Saída", ...opcoes }));

    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
    expect(painel()).not.toHaveAttribute("open");
  });

  it("marca a tela atual no painel, e só ela", async () => {
    pathname = "/caixa";
    await abrir();

    const links = within(painel()).getAllByRole("link", opcoes);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page").map((link) => link.textContent)).toEqual(["Caixa"]);
  });

  it("fecha no botão de fechar e devolve o foco ao botão Menu", async () => {
    const user = await abrir();
    await user.click(within(painel()).getByRole("button", { name: "Fechar menu", ...opcoes }));

    expect(painel()).not.toHaveAttribute("open");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("fecha ao tocar no fundo, mas não ao tocar no conteúdo", async () => {
    const user = await abrir();

    await user.click(within(painel()).getByRole("heading", { name: "Menu", ...opcoes }));
    expect(painel()).toHaveAttribute("open");

    await user.click(painel());
    expect(painel()).not.toHaveAttribute("open");
  });

  it("fecha ao escolher uma tela", async () => {
    const user = await abrir();
    await user.click(within(painel()).getByRole("link", { name: "Caixa", ...opcoes }));
    expect(painel()).not.toHaveAttribute("open");
  });

  it("fecha quando o navegador fecha o painel por conta própria (Esc) e volta o foco ao Menu", async () => {
    await abrir();
    // O Esc nativo fecha o <dialog> e dispara `close`; o jsdom não faz isso, então simulamos o resultado.
    act(() => painel().close());

    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("fecha quando a rota muda", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithTheme(<BottomNav />);
    await user.click(menuButton());
    expect(painel()).toHaveAttribute("open");

    pathname = "/patio";
    rerender(<BottomNav />);
    expect(painel()).not.toHaveAttribute("open");
  });

  it("fecha quando a tela cresce até o breakpoint do pórtico", async () => {
    await abrir();
    expect(mediaListeners).toHaveLength(1);

    act(() => mediaListeners[0]({ matches: true } as MediaQueryListEvent));
    expect(painel()).not.toHaveAttribute("open");
  });

  it("remove o ouvinte da media query ao desmontar", () => {
    const { unmount } = renderWithTheme(<BottomNav />);
    expect(mediaListeners).toHaveLength(1);
    unmount();
    expect(mediaListeners).toHaveLength(0);
  });
});
