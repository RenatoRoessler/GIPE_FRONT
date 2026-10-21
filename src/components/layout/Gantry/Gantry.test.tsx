import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { Gantry } from "./Gantry";

// O menu do computador começa escondido por CSS e só aparece a partir de `breakpoints.lg`: o jsdom não avalia a
// media query, então as consultas pedem também os elementos escondidos.
const opcoes = { hidden: true } as const;

describe("Gantry (menu do computador)", () => {
  it("mostra o Pátio entre Saída de Veículos e Caixa", () => {
    pathname = "/dashboard";
    const { container } = renderWithTheme(<Gantry />);

    const menu = container.querySelector("nav");
    expect(menu).toHaveAttribute("aria-label", "Menu principal");
    const links = within(menu as HTMLElement).getAllByRole("link", opcoes);
    const nomes = links.map((link) => link.textContent);

    expect(nomes).toContain("Pátio");
    expect(nomes.indexOf("Pátio")).toBe(nomes.indexOf("Saída de Veículos") + 1);
    expect(nomes.indexOf("Caixa")).toBe(nomes.indexOf("Pátio") + 1);
    expect(screen.getByRole("link", { name: "Pátio", ...opcoes })).toHaveAttribute("href", "/patio");
  });

  it("o Pátio fica ativo em /patio, e só ele", () => {
    pathname = "/patio";
    renderWithTheme(<Gantry />);

    expect(screen.getByRole("link", { name: "Pátio", ...opcoes })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Saída de Veículos", ...opcoes })).not.toHaveAttribute("aria-current");
  });

  it("o ícone do Pátio renderiza e é decorativo", () => {
    pathname = "/dashboard";
    renderWithTheme(<Gantry />);

    const icone = screen.getByRole("link", { name: "Pátio", ...opcoes }).querySelector("svg");
    expect(icone).not.toBeNull();
    expect(icone).toHaveAttribute("aria-hidden", "true");
  });
});
