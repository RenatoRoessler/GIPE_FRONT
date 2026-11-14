import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const servico = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => servico);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 9 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

// A fila tem o seu próprio teste: aqui só importa o que a página põe em volta dela.
vi.mock("../FilaServicos", () => ({ FilaServicos: () => <p>conteúdo da fila</p> }));

import { FilaServicosEsqueleto, FilaServicosPage } from "./FilaServicosPage";

const CONFIG = { modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null };

beforeEach(() => {
  vi.clearAllMocks();
  servico.getConfiguracao.mockResolvedValue(CONFIG);
  sessao.atual = { user: { name: "Ana", perfil: 9 }, isLoading: false };
});

describe("FilaServicosPage", () => {
  it("tem o título da tela, sem abas, e mostra a fila", () => {
    renderWithProviders(<FilaServicosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Fila de serviços" })).toBeInTheDocument();
    expect(screen.getByText("conteúdo da fila")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("com os serviços desligados, avisa e orienta quem não configura a pedir a quem pode", async () => {
    servico.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderWithProviders(<FilaServicosPage />);

    expect(await screen.findByText("Os serviços estão desligados nesta empresa")).toBeInTheDocument();
    expect(screen.getByText(/Peça a um administrador ou gerente/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ligar em Configurações" })).not.toBeInTheDocument();
    // A fila continua à mão.
    expect(screen.getByText("conteúdo da fila")).toBeInTheDocument();
  });

  it("com os serviços ligados não mostra o aviso", async () => {
    renderWithProviders(<FilaServicosPage />);

    await screen.findByText("conteúdo da fila");
    expect(servico.getConfiguracao).toHaveBeenCalled();
    expect(screen.queryByText("Os serviços estão desligados nesta empresa")).not.toBeInTheDocument();
  });
});

describe("FilaServicosEsqueleto", () => {
  it("mostra o título certo e um estado de carregamento", () => {
    renderWithProviders(<FilaServicosEsqueleto />);

    expect(screen.getByRole("heading", { level: 1, name: "Fila de serviços" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando a fila de serviços" })).toBeInTheDocument();
  });
});
