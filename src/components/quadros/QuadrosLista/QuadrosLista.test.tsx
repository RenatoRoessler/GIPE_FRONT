import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { QuadroChaves } from "@/types/quadroChaves";

const push = vi.hoisted(() => vi.fn());
const perfil = vi.hoisted(() => ({ atual: 1 }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "x", name: "Renato", email: "r@e.com", perfil: perfil.atual }, isLoading: false }),
}));
vi.mock("@/lib/api/services/quadroChaves", () => ({
  listQuadros: vi.fn(),
  inativarQuadro: vi.fn(),
  excluirPosicao: vi.fn(),
}));

import { excluirPosicao, inativarQuadro, listQuadros } from "@/lib/api/services/quadroChaves";
import { QuadrosLista } from "./QuadrosLista";

const listar = vi.mocked(listQuadros);
const inativar = vi.mocked(inativarQuadro);
const excluir = vi.mocked(excluirPosicao);

const recepcao: QuadroChaves = {
  patioQuadroId: 3,
  nome: "Recepção",
  linhas: [
    {
      linha: "A",
      colunas: [
        { patioQuadroChaveId: 1, coluna: 1, disponivel: false },
        { patioQuadroChaveId: 2, coluna: 2, disponivel: true },
        { patioQuadroChaveId: 3, coluna: 3, disponivel: true },
      ],
    },
  ],
};

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
  vi.resetAllMocks();
  perfil.atual = 1;
});

describe("QuadrosLista", () => {
  it("mostra o carregamento", () => {
    listar.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<QuadrosLista />);
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });

  it("lista os quadros com o total e os livres", async () => {
    listar.mockResolvedValue([recepcao]);
    renderWithProviders(<QuadrosLista />);
    expect(await screen.findByRole("heading", { name: "Recepção" })).toBeInTheDocument();
    expect(screen.getByText("3 ganchos · 2 livres")).toBeInTheDocument();
  });

  it("sem quadros convida a criar o primeiro", async () => {
    listar.mockResolvedValue([]);
    renderWithProviders(<QuadrosLista />);
    await userEvent.click(await screen.findByRole("button", { name: "Criar primeiro quadro" }));
    expect(push).toHaveBeenCalledWith("/quadros-chaves/novo");
  });

  it("sem permissão para gerenciar mostra o vazio sem a chamada para criar", async () => {
    perfil.atual = 3;
    listar.mockResolvedValue([]);
    renderWithProviders(<QuadrosLista />);
    expect(await screen.findByText(/Nenhum quadro cadastrado/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar primeiro quadro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo quadro" })).not.toBeInTheDocument();
  });

  it("no erro de rede oferece tentar novamente", async () => {
    listar.mockRejectedValueOnce(new ApiError("network")).mockResolvedValue([recepcao]);
    renderWithProviders(<QuadrosLista />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os quadros.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Recepção" })).toBeInTheDocument();
  });

  it("no 403 avisa da permissão", async () => {
    listar.mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<QuadrosLista />);
    expect(await screen.findByText("Você não tem permissão para acessar esta página.")).toBeInTheDocument();
  });

  it("inativa o quadro depois de confirmar", async () => {
    listar.mockResolvedValue([recepcao]);
    inativar.mockResolvedValue(undefined);
    renderWithProviders(<QuadrosLista />);
    await userEvent.click(await screen.findByRole("button", { name: "Inativar" }));
    expect(screen.getByText("Inativar quadro Recepção?")).toBeInTheDocument();
    listar.mockResolvedValue([]);
    await userEvent.click(screen.getAllByRole("button", { name: "Inativar" }).at(-1)!);
    expect(inativar).toHaveBeenCalledWith(3);
    expect(await screen.findByText("Quadro Recepção inativado.")).toBeInTheDocument();
  });

  it("inativar com chaves no pátio mostra o motivo e só oferece Entendi", async () => {
    listar.mockResolvedValue([recepcao]);
    inativar.mockRejectedValue(new ApiError("validation", "O quadro está com as chaves de ABC1D23.", 400));
    renderWithProviders(<QuadrosLista />);
    await userEvent.click(await screen.findByRole("button", { name: "Inativar" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Inativar" }).at(-1)!);
    expect(await screen.findByText("O quadro está com as chaves de ABC1D23.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByText("O quadro está com as chaves de ABC1D23.")).not.toBeInTheDocument();
  });

  it("exclui um gancho livre depois de confirmar e não deixa tocar no ocupado", async () => {
    listar.mockResolvedValue([recepcao]);
    excluir.mockResolvedValue(undefined);
    renderWithProviders(<QuadrosLista />);
    await userEvent.click(await screen.findByRole("button", { name: "Ver ganchos" }));
    expect(screen.queryByRole("button", { name: /A1/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "A3, livre" }));
    expect(screen.getByText("Excluir o gancho A3?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(excluir).toHaveBeenCalledWith(3);
    expect(await screen.findByText("Gancho A3 excluído.")).toBeInTheDocument();
  });

  it("leva a Adicionar posições do quadro", async () => {
    listar.mockResolvedValue([recepcao]);
    renderWithProviders(<QuadrosLista />);
    await userEvent.click(await screen.findByRole("button", { name: "Adicionar posições" }));
    expect(push).toHaveBeenCalledWith("/quadros-chaves/3/posicoes");
  });
});
