import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Usuario } from "@/types/usuario";

vi.mock("@/lib/api/services/usuario", () => ({ listUsuarios: vi.fn() }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "x", name: "Renato", email: "Renato@Exemplo.com", perfil: 1 }, isLoading: false }),
}));

import { listUsuarios } from "@/lib/api/services/usuario";
import { UsuariosList } from "./UsuariosList";

const listar = vi.mocked(listUsuarios);

function usuario(over: Partial<Usuario>): Usuario {
  return {
    usuarioId: 1,
    cpf: "11011954010",
    nome: "Renato",
    email: "renato@exemplo.com",
    celular: "54996384949",
    perfil: 1,
    perfilDescricao: "Administrador",
    ativo: true,
    trocarSenha: false,
    dataCriacao: "2026-10-08T16:54:36.990448",
    ...over,
  };
}

const handlers = { onNovo: vi.fn(), onEditar: vi.fn() };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("UsuariosList", () => {
  it("no 403 avisa da permissão, leva ao início e não oferece nova tentativa", async () => {
    listar.mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<UsuariosList {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("mostra o carregamento", () => {
    listar.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<UsuariosList {...handlers} />);
    expect(screen.getByRole("status", { name: "Carregando usuários" })).toBeInTheDocument();
  });

  it("lista os usuários com perfil em português, status e máscara", async () => {
    listar.mockResolvedValue([usuario({}), usuario({ usuarioId: 2, nome: "Ana", email: "ana@exemplo.com", perfil: 4, ativo: false })]);
    renderWithProviders(<UsuariosList {...handlers} />);
    expect((await screen.findAllByText("110.119.540-10", { selector: "td" })).length).toBe(2);
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("Caixa")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(screen.getAllByText("(54) 99638-4949", { selector: "td[data-label='Celular']" })).toHaveLength(2);
  });

  it("marca o usuário logado com (você), comparando o e-mail sem diferenciar maiúsculas", async () => {
    listar.mockResolvedValue([usuario({}), usuario({ usuarioId: 2, nome: "Ana", email: "ana@exemplo.com" })]);
    renderWithProviders(<UsuariosList {...handlers} />);
    expect(await screen.findByText(/Renato \(você\)/)).toBeInTheDocument();
    expect(screen.queryByText(/Ana \(você\)/)).not.toBeInTheDocument();
  });

  it("marca a linha inativa e mostra perfil desconhecido", async () => {
    listar.mockResolvedValue([usuario({ usuarioId: 3, nome: "Zé", email: "ze@exemplo.com", perfil: 9, perfilDescricao: "Auditor", ativo: false })]);
    renderWithProviders(<UsuariosList {...handlers} />);
    expect(await screen.findByText("Auditor")).toBeInTheDocument();
    expect(screen.getByText("Zé").closest("tr")).toHaveAttribute("data-inativo", "true");
  });

  it("abre a edição pelo botão com nome acessível", async () => {
    const ana = usuario({ usuarioId: 2, nome: "Ana", email: "ana@exemplo.com" });
    listar.mockResolvedValue([ana]);
    renderWithProviders(<UsuariosList {...handlers} />);
    await userEvent.click(await screen.findByRole("button", { name: "Editar Ana" }));
    expect(handlers.onEditar).toHaveBeenCalledWith(ana);
  });

  it("mostra o erro e tenta de novo", async () => {
    listar.mockRejectedValueOnce(new ApiError("server")).mockResolvedValueOnce([usuario({})]);
    renderWithProviders(<UsuariosList {...handlers} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os usuários");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(/Renato/)).toBeInTheDocument();
  });

  it("mostra o estado vazio com a ação de cadastro", async () => {
    listar.mockResolvedValue([]);
    renderWithProviders(<UsuariosList {...handlers} />);
    await userEvent.click(await screen.findByRole("button", { name: "Novo usuário" }));
    expect(handlers.onNovo).toHaveBeenCalled();
  });
});
