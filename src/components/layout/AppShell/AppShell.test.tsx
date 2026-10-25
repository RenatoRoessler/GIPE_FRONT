import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Maria", perfil: 1 }, isLoading: false }) }));
vi.mock("@/contexts/ThemeModeContext", () => ({ useThemeMode: () => ({ mode: "light", toggleThemeMode: vi.fn() }) }));
vi.mock("@/components/layout/UserMenu", () => ({ UserMenu: () => <div data-testid="user-menu" /> }));
vi.mock("@/components/layout/InstallPwaButton", () => ({ InstallPwaButton: () => null }));
// A largura real não existe no jsdom: a barra cabe 5 espaços.
vi.mock("@/components/layout/BottomNav/useBarCapacity", () => ({ useBarCapacity: () => ({ ref: vi.fn(), capacidade: 5 }) }));

import { AppShell } from "./AppShell";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("AppShell", () => {
  it("renderiza o conteúdo e a barra inferior, sem o pórtico do topo", () => {
    const { container } = renderWithTheme(
      <AppShell>
        <p>Conteúdo da tela</p>
      </AppShell>,
    );

    expect(screen.getByText("Conteúdo da tela")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(container.querySelector('nav[aria-label="Menu principal"]')).not.toBeInTheDocument();
  });

  it("a única navegação principal é a barra inferior, com o botão Mais", () => {
    renderWithTheme(
      <AppShell>
        <p>Conteúdo da tela</p>
      </AppShell>,
    );

    expect(screen.getAllByRole("navigation", { hidden: true }).filter((nav) => nav.getAttribute("aria-label") === "Navegação principal")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toContainElement(screen.getByRole("button", { name: "Mais" }));
  });

  it("o cabeçalho mantém o logotipo, as boas-vindas e o menu do usuário", () => {
    renderWithTheme(
      <AppShell>
        <p>Conteúdo da tela</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "Murel — ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Olá, Maria")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });
});
