import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const servico = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => servico);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { ConfiguracoesPage } from "./ConfiguracoesPage";

const GRAVADA = { modelo: true, cor: true, prisma: false, servicos: false, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null };

beforeEach(() => {
  vi.clearAllMocks();
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
});

describe("ConfiguracoesPage", () => {
  it("mostra o título e o esqueleto enquanto carrega", () => {
    servico.getConfiguracao.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ConfiguracoesPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Configurações" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando as configurações" })).toHaveAttribute("aria-busy", "true");
  });

  it("com os dados, mostra o formulário editável", async () => {
    servico.getConfiguracao.mockResolvedValue(GRAVADA);
    renderWithProviders(<ConfiguracoesPage />);
    expect(await screen.findByRole("switch", { name: "Modelo obrigatório" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("perfil sem edição vê só os valores", async () => {
    sessao.atual = { user: { name: "Beto", perfil: 4 }, isLoading: false };
    servico.getConfiguracao.mockResolvedValue(GRAVADA);
    renderWithProviders(<ConfiguracoesPage />);
    expect(await screen.findByRole("switch", { name: "Modelo obrigatório" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  });

  it("no 403 avisa da permissão e não oferece nova tentativa", async () => {
    servico.getConfiguracao.mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<ConfiguracoesPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("em outros erros mostra a mensagem e oferece nova tentativa", async () => {
    servico.getConfiguracao.mockRejectedValue(new ApiError("server"));
    renderWithProviders(<ConfiguracoesPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
