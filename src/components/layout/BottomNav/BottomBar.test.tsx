import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { navItemsPorPrioridade } from "@/lib/nav";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { BottomBar } from "./BottomBar";

// Início, Entrada, Saída e Pátio: o que cabe numa tela de 320px a 375px, com o "Mais" no quinto espaço.
const itensDoAdmin = navItemsPorPrioridade(1);
const quatro = itensDoAdmin.slice(0, 4);

function renderBar(props: Partial<React.ComponentProps<typeof BottomBar>> = {}) {
  const onMenuClick = vi.fn();
  const onAction = vi.fn();
  const view = renderWithTheme(
    <BottomBar
      itens={quatro}
      temMais
      maisAtivo={false}
      carregando={false}
      menuOpen={false}
      onMenuClick={onMenuClick}
      onAction={onAction}
      menuId="painel"
      {...props}
    />,
  );
  return { onMenuClick, onAction, ...view };
}

describe("BottomBar", () => {
  it("mostra Início (link), Entrada e Saída (botões), Pátio (link) e o botão Mais", () => {
    pathname = "/dashboard";
    renderBar();

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "Entrada" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByRole("button", { name: "Saída" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByRole("link", { name: "Pátio" })).toHaveAttribute("href", "/patio");
    expect(screen.getByRole("button", { name: "Mais" })).toBeInTheDocument();
    // Entrada e Saída não levam a nenhuma página.
    expect(screen.queryByRole("link", { name: "Entrada" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Saída" })).not.toBeInTheDocument();
  });

  it("usa o rótulo curto de cada item, não o nome completo", () => {
    renderBar();

    expect(screen.getByRole("button", { name: "Entrada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Entrada de Veículos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saída de Veículos" })).not.toBeInTheDocument();
  });

  it("sem itens fora da barra não mostra o botão Mais", () => {
    renderBar({ itens: itensDoAdmin, temMais: false });

    expect(screen.queryByRole("button", { name: "Mais" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(8);
    expect(screen.getByRole("link", { name: "Empresa" })).toHaveAttribute("href", "/minha-empresa");
  });

  it("tocar em Entrada ou Saída chama a ação certa", async () => {
    pathname = "/caixa";
    const { onAction } = renderBar();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Entrada" }));
    await user.click(screen.getByRole("button", { name: "Saída" }));

    expect(onAction.mock.calls).toEqual([["entrada"], ["saida"]]);
  });

  it("Entrada e Saída nunca ficam marcadas como página atual", () => {
    for (const rota of ["/dashboard", "/veiculos/saida", "/patio"]) {
      pathname = rota;
      const { unmount } = renderBar();
      expect(screen.getByRole("button", { name: "Entrada" })).not.toHaveAttribute("aria-current");
      expect(screen.getByRole("button", { name: "Saída" })).not.toHaveAttribute("aria-current");
      unmount();
    }
  });

  it("marca como página atual só o link da rota atual", () => {
    pathname = "/dashboard";
    const { unmount } = renderBar();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pátio" })).not.toHaveAttribute("aria-current");
    unmount();

    pathname = "/patio/detalhe";
    renderBar();
    expect(screen.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Pátio" })).toHaveAttribute("aria-current", "page");
  });

  it("destaca o Mais só quando pedido (painel aberto ou tela atual entre os itens que não couberam)", () => {
    pathname = "/caixa";
    const { unmount } = renderBar({ maisAtivo: true });
    expect(screen.getByRole("button", { name: "Mais" })).toHaveStyle({ color: lightTheme.colors.text });
    unmount();

    renderBar({ maisAtivo: false });
    expect(screen.getByRole("button", { name: "Mais" })).toHaveStyle({ color: lightTheme.colors.textMuted });
  });

  it("cada aba tem um ícone próprio, decorativo, no traço do protótipo", () => {
    pathname = "/dashboard";
    renderBar();

    const abas = [
      screen.getByRole("link", { name: "Início" }),
      screen.getByRole("button", { name: "Entrada" }),
      screen.getByRole("button", { name: "Saída" }),
      screen.getByRole("link", { name: "Pátio" }),
      screen.getByRole("button", { name: "Mais" }),
    ];
    const desenhos = abas.map((aba) => {
      const icone = aba.querySelector("svg");
      expect(icone).toHaveAttribute("aria-hidden", "true");
      expect(icone).toHaveAttribute("stroke-width", "2.4");
      return icone?.innerHTML;
    });
    // Cinco desenhos diferentes: Entrada e Saída não podem repetir o mesmo ícone.
    expect(new Set(desenhos).size).toBe(5);
  });

  it("o botão Mais expõe o estado do painel e avisa o clique", async () => {
    pathname = "/dashboard";
    const { onMenuClick } = renderBar({ menuOpen: true });
    const mais = screen.getByRole("button", { name: "Mais" });

    expect(mais).toHaveAttribute("aria-expanded", "true");
    expect(mais).toHaveAttribute("aria-controls", "painel");
    expect(mais).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.setup().click(mais);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it("enquanto carrega, mostra espaços reservados e nenhum atalho nem o Mais", () => {
    renderBar({ carregando: true });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" }).querySelector("[aria-busy='true']")).toBeInTheDocument();
  });

  it("entrega o elemento externo da barra para ser medido", () => {
    const barRef = vi.fn();
    renderBar({ barRef });

    expect(barRef).toHaveBeenCalledWith(screen.getByRole("navigation", { name: "Navegação principal" }));
  });

  it("divide a largura em colunas iguais, uma por item e uma para o Mais", () => {
    renderBar();

    const grade = screen.getByRole("navigation", { name: "Navegação principal" }).firstElementChild;
    expect(grade).toHaveStyle({ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" });
  });
});
