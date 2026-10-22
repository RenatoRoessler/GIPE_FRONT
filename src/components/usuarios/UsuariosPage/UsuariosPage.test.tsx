import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

vi.mock("@/lib/api/services/usuario", () => ({ listUsuarios: vi.fn() }));
const useCurrentUser = vi.fn();
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => useCurrentUser() }));

import { listUsuarios } from "@/lib/api/services/usuario";
import { UsuariosPage } from "./UsuariosPage";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listUsuarios).mockResolvedValue([]);
});

describe("UsuariosPage", () => {
  it("Administrador vê a lista", async () => {
    useCurrentUser.mockReturnValue({ user: { id: "x", name: "A", perfil: 1 }, isLoading: false });
    renderWithProviders(<UsuariosPage />);
    expect(await screen.findByText("Nenhum usuário encontrado.")).toBeInTheDocument();
    expect(listUsuarios).toHaveBeenCalled();
  });

  it.each([[4], [null], [undefined]])("perfil %s vê o aviso e a API não é chamada", (perfil) => {
    useCurrentUser.mockReturnValue({ user: { id: "x", name: "A", perfil }, isLoading: false });
    renderWithProviders(<UsuariosPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão");
    expect(listUsuarios).not.toHaveBeenCalled();
  });

  it("enquanto carrega a sessão não decide nem chama a API", () => {
    useCurrentUser.mockReturnValue({ user: null, isLoading: true });
    renderWithProviders(<UsuariosPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(listUsuarios).not.toHaveBeenCalled();
  });
});
