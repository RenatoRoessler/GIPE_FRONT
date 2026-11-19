import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const logout = vi.fn();
vi.mock("@/hooks/useLogout", () => ({ useLogout: () => logout }));
vi.mock("@/hooks/usePwaInstall", () => ({ usePwaInstall: () => ({ canInstall: false, showIosHint: false, install: vi.fn() }) }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Maria Souza", perfil: 1 }, isLoading: false }) }));
vi.mock("@/components/usuarios/AlterarSenhaModal", () => ({ AlterarSenhaModal: () => null }));
const abrirTour = vi.fn();
vi.mock("@/components/onboarding", () => ({ useOnboardingTour: () => ({ abrirTour }) }));

import { UserMenu } from "./UserMenu";

beforeEach(() => {
  logout.mockReset();
  abrirTour.mockReset();
});

describe("UserMenu", () => {
  it("mostra as iniciais do usuário no botão", () => {
    renderWithTheme(<UserMenu />);

    expect(screen.getByRole("button", { name: "Menu do usuário" })).toHaveTextContent("MS");
  });

  it("Sair fecha o menu e encerra a sessão pelo hook", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Menu do usuário" }));
    await user.click(screen.getByRole("menuitem", { name: "Sair" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Repetir tour fecha o menu e reabre o tour de boas-vindas", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Menu do usuário" }));
    await user.click(screen.getByRole("menuitem", { name: "Repetir tour" }));

    expect(abrirTour).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Repetir tour fica entre Alterar senha e Sair, e é acessível pelo teclado", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Menu do usuário" }));

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Alterar senha", "Repetir tour", "Sair"]);

    screen.getByRole("menuitem", { name: "Repetir tour" }).focus();
    await user.keyboard("{Enter}");

    expect(abrirTour).toHaveBeenCalledTimes(1);
  });
});
