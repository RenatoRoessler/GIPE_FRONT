import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

let pathname = "/dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
const sessao = vi.hoisted(() => ({ atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));
const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("@/components/veiculos/VeiculoModais", () => ({ useVeiculoModais: () => modais }));

import { Gantry } from "./Gantry";

// O menu do computador começa escondido por CSS e só aparece a partir de `breakpoints.lg`: o jsdom não avalia a
// media query, então as consultas pedem também os elementos escondidos.
const opcoes = { hidden: true } as const;

describe("Gantry (menu do computador)", () => {
  beforeEach(() => {
    sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
    modais.abrirEntrada.mockReset();
    modais.abrirSaida.mockReset();
  });

  it("mostra o Pátio entre Saída de Veículos e Caixa", () => {
    pathname = "/dashboard";
    const { container } = renderWithTheme(<Gantry />);

    const menu = container.querySelector("nav");
    expect(menu).toHaveAttribute("aria-label", "Menu principal");
    // Links e botões de ação (Entrada e Saída), na ordem em que aparecem.
    const nomes = Array.from((menu as HTMLElement).querySelectorAll("li > a, li > button")).map((item) => item.textContent);

    expect(nomes).toContain("Pátio");
    expect(nomes.indexOf("Pátio")).toBe(nomes.indexOf("Saída de Veículos") + 1);
    expect(nomes.indexOf("Caixa")).toBe(nomes.indexOf("Pátio") + 1);
    expect(screen.getByRole("link", { name: "Pátio", ...opcoes })).toHaveAttribute("href", "/patio");
  });

  it("o Pátio fica ativo em /patio, e só ele", () => {
    pathname = "/patio";
    renderWithTheme(<Gantry />);

    expect(screen.getByRole("link", { name: "Pátio", ...opcoes })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Saída de Veículos", ...opcoes })).not.toHaveAttribute("aria-current");
  });

  it("Entrada e Saída são botões que abrem o modal, não links, e nunca ficam como página atual", async () => {
    pathname = "/veiculos/entrada";
    renderWithTheme(<Gantry />);
    const user = userEvent.setup();

    expect(screen.queryByRole("link", { name: "Entrada de Veículos", ...opcoes })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Saída de Veículos", ...opcoes })).not.toBeInTheDocument();
    const entrada = screen.getByRole("button", { name: "Entrada de Veículos", ...opcoes });
    const saida = screen.getByRole("button", { name: "Saída de Veículos", ...opcoes });
    expect(entrada).toHaveAttribute("aria-haspopup", "dialog");
    expect(entrada).not.toHaveAttribute("aria-current");

    await user.click(entrada);
    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).not.toHaveBeenCalled();

    await user.click(saida);
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
  });

  it("Entrada e Saída são <button type=\"button\">, então Enter e Espaço os acionam sem código extra", () => {
    pathname = "/dashboard";
    renderWithTheme(<Gantry />);

    for (const nome of ["Entrada de Veículos", "Saída de Veículos"]) {
      const botao = screen.getByRole("button", { name: nome, ...opcoes });
      expect(botao.tagName).toBe("BUTTON");
      expect(botao).toHaveAttribute("type", "button");
    }
  });

  it("o ícone do Pátio renderiza e é decorativo", () => {
    pathname = "/dashboard";
    renderWithTheme(<Gantry />);

    const icone = screen.getByRole("link", { name: "Pátio", ...opcoes }).querySelector("svg");
    expect(icone).not.toBeNull();
    expect(icone).toHaveAttribute("aria-hidden", "true");
  });

  describe("permissão por perfil", () => {
    function itensDoMenu() {
      pathname = "/dashboard";
      const { container } = renderWithTheme(<Gantry />);
      return Array.from((container.querySelector("nav") as HTMLElement).querySelectorAll("li > a, li > button")).map((item) => item.textContent);
    }

    it("o Manobrista não vê preços, usuários, mensalistas, notas fiscais, relatórios nem a empresa", () => {
      sessao.atual = { user: { name: "Joao", perfil: 3 }, isLoading: false };

      expect(itensDoMenu()).toEqual(["Início", "Entrada de Veículos", "Saída de Veículos", "Pátio", "Caixa"]);
    });

    it("o Financeiro vê o início e as notas fiscais, sem pátio nem caixa", () => {
      sessao.atual = { user: { name: "Ana", perfil: 8 }, isLoading: false };

      expect(itensDoMenu()).toEqual(["Início", "Notas Fiscais"]);
    });

    it("só o Administrador vê a Minha Empresa", () => {
      expect(itensDoMenu()).toContain("Minha Empresa");
    });

    it("perfil desconhecido vê só o Início", () => {
      sessao.atual = { user: { name: "Zé", perfil: null }, isLoading: false };

      expect(itensDoMenu()).toEqual(["Início"]);
    });

    it("enquanto o perfil não é conhecido, mostra esqueletos e nenhum item do menu", () => {
      sessao.atual = { user: null, isLoading: true };
      const { container } = renderWithTheme(<Gantry />);

      expect(container.querySelectorAll("li > a, li > button")).toHaveLength(0);
      expect(container.querySelectorAll("li")).not.toHaveLength(0);
      expect(container.querySelector("ul")).toHaveAttribute("aria-busy", "true");
    });
  });
});
