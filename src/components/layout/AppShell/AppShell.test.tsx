import { screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Maria", perfil: 1 }, isLoading: false }) }));
vi.mock("@/contexts/ThemeModeContext", () => ({ useThemeMode: () => ({ mode: "light", toggleThemeMode: vi.fn() }) }));
vi.mock("@/components/layout/UserMenu", () => ({ UserMenu: () => <div data-testid="user-menu" /> }));
vi.mock("@/components/layout/InstallPwaButton", () => ({ InstallPwaButton: () => null }));

import { AppShell } from "./AppShell";

// O pórtico e a barra inferior se alternam por CSS (breakpoint `lg`): o jsdom não avalia a media query.
const opcoes = { hidden: true } as const;

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe("AppShell", () => {
  it("renderiza o conteúdo, o pórtico do computador e a barra inferior do celular", () => {
    const { container } = renderWithTheme(
      <AppShell>
        <p>Conteúdo da tela</p>
      </AppShell>,
    );

    expect(screen.getByText("Conteúdo da tela")).toBeInTheDocument();
    // Escondido por CSS, o pórtico não tem o nome acessível calculado no jsdom: confere pelo atributo.
    expect(container.querySelector('nav[aria-label="Menu principal"]')).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal", ...opcoes })).toBeInTheDocument();
  });

  it("o cabeçalho não tem mais o botão Menu do celular: só a barra inferior o oferece", () => {
    renderWithTheme(
      <AppShell>
        <p>Conteúdo da tela</p>
      </AppShell>,
    );

    const botoesMenu = screen.getAllByRole("button", { name: "Menu", ...opcoes });
    expect(botoesMenu).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Navegação principal", ...opcoes })).toContainElement(botoesMenu[0]);
  });
});
