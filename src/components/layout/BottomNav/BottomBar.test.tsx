import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { BottomBar } from "./BottomBar";

// A barra só aparece abaixo de `breakpoints.lg` por CSS; o jsdom não avalia a media query.
const opcoes = { hidden: true } as const;

function renderBar(props: Partial<React.ComponentProps<typeof BottomBar>> = {}) {
  const onMenuClick = vi.fn();
  const onAction = vi.fn();
  const view = renderWithTheme(<BottomBar menuOpen={false} onMenuClick={onMenuClick} onAction={onAction} menuId="painel" {...props} />);
  return { onMenuClick, onAction, ...view };
}

describe("BottomBar", () => {
  it("mostra Início (link), Entrada e Saída (botões) e Menu", () => {
    pathname = "/dashboard";
    renderBar();

    expect(screen.getByRole("navigation", { name: "Navegação principal", ...opcoes })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início", ...opcoes })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "Entrada", ...opcoes })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByRole("button", { name: "Saída", ...opcoes })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByRole("button", { name: "Menu", ...opcoes })).toBeInTheDocument();
    // Entrada e Saída não levam a nenhuma página.
    expect(screen.queryByRole("link", { name: "Entrada", ...opcoes })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Saída", ...opcoes })).not.toBeInTheDocument();
  });

  it("tocar em Entrada ou Saída chama a ação certa", async () => {
    pathname = "/caixa";
    const { onAction } = renderBar();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Entrada", ...opcoes }));
    await user.click(screen.getByRole("button", { name: "Saída", ...opcoes }));

    expect(onAction.mock.calls).toEqual([["entrada"], ["saida"]]);
  });

  it("Entrada e Saída nunca ficam marcadas como página atual", () => {
    for (const rota of ["/dashboard", "/veiculos/saida", "/patio"]) {
      pathname = rota;
      const { unmount } = renderBar();
      expect(screen.getByRole("button", { name: "Entrada", ...opcoes })).not.toHaveAttribute("aria-current");
      expect(screen.getByRole("button", { name: "Saída", ...opcoes })).not.toHaveAttribute("aria-current");
      unmount();
    }
  });

  it("marca o Início como página atual só no Início", () => {
    pathname = "/dashboard";
    const { unmount } = renderBar();
    expect(screen.getByRole("link", { name: "Início", ...opcoes })).toHaveAttribute("aria-current", "page");
    unmount();

    pathname = "/caixa";
    renderBar();
    expect(screen.getByRole("link", { name: "Início", ...opcoes })).not.toHaveAttribute("aria-current");
  });

  it("destaca o Menu em qualquer tela que não seja o Início", () => {
    pathname = "/caixa";
    renderBar();
    expect(screen.getByRole("button", { name: "Menu", ...opcoes })).toHaveStyle({ color: lightTheme.colors.primary });
  });

  it("não destaca o Menu no Início, a menos que o painel esteja aberto", () => {
    pathname = "/dashboard";
    const { unmount } = renderBar();
    expect(screen.getByRole("button", { name: "Menu", ...opcoes })).toHaveStyle({ color: lightTheme.colors.textMuted });
    unmount();

    renderBar({ menuOpen: true });
    expect(screen.getByRole("button", { name: "Menu", ...opcoes })).toHaveStyle({ color: lightTheme.colors.primary });
  });

  it("cada aba tem um ícone próprio, decorativo, no traço do protótipo", () => {
    pathname = "/dashboard";
    renderBar();

    const abas = [
      screen.getByRole("link", { name: "Início", ...opcoes }),
      screen.getByRole("button", { name: "Entrada", ...opcoes }),
      screen.getByRole("button", { name: "Saída", ...opcoes }),
      screen.getByRole("button", { name: "Menu", ...opcoes }),
    ];
    const desenhos = abas.map((aba) => {
      const icone = aba.querySelector("svg");
      expect(icone).toHaveAttribute("aria-hidden", "true");
      expect(icone).toHaveAttribute("stroke-width", "2.4");
      return icone?.innerHTML;
    });
    // Quatro desenhos diferentes: Entrada e Saída não podem repetir o mesmo ícone.
    expect(new Set(desenhos).size).toBe(4);
  });

  it("o botão Menu expõe o estado do painel e avisa o clique", async () => {
    pathname = "/dashboard";
    const { onMenuClick } = renderBar({ menuOpen: true });
    const menu = screen.getByRole("button", { name: "Menu", ...opcoes });

    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(menu).toHaveAttribute("aria-controls", "painel");
    expect(menu).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.setup().click(menu);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
