import { screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { Servico } from "@/types/servico";

const config = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => config);

const api = vi.hoisted(() => ({ listServicos: vi.fn(), criarServico: vi.fn(), atualizarServico: vi.fn(), inativarServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

const navegacao = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navegacao.push, replace: navegacao.replace }),
  usePathname: () => "/servicos/catalogo",
  useSearchParams: () => navegacao.params,
}));
vi.mock("@/hooks/useMediaQuery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useMediaQuery")>()),
  useIsMobile: () => false,
}));

import { CatalogoServicosEsqueleto, CatalogoServicosPage } from "./CatalogoServicosPage";

const CONFIG = { modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null };

const LAVAGEM: Servico = {
  id: 1,
  nome: "Lavagem completa",
  descricao: "Externa e interna",
  duracaoMinutos: 60,
  tempoPermitidoMinutos: 180,
  ativo: true,
  precos: [{ categoria: 1, descricao: "Moto", valorCentavos: 5000, duracaoMinutos: 60, tempoPermitidoMinutos: 180 }],
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
  vi.clearAllMocks();
  navegacao.params = new URLSearchParams();
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
  config.getConfiguracao.mockResolvedValue(CONFIG);
  api.listServicos.mockResolvedValue([LAVAGEM]);
});

describe("CatalogoServicosPage", () => {
  it("o Administrador vê o título, os serviços ativos e o botão Novo serviço", async () => {
    renderWithProviders(<CatalogoServicosPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "Serviços" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo serviço" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("quem não mantém o catálogo só consulta: sem o botão Novo serviço", async () => {
    sessao.atual = { user: { name: "Fábio", perfil: 8 }, isLoading: false };
    renderWithProviders(<CatalogoServicosPage />);

    expect(await screen.findByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo serviço" })).not.toBeInTheDocument();
  });

  it("clicar num serviço abre o cadastro dele e Novo serviço abre o cadastro em branco", async () => {
    const { default: user } = await import("@testing-library/user-event");
    renderWithProviders(<CatalogoServicosPage />);

    await user.click(await screen.findByRole("button", { name: /Lavagem completa/ }));
    expect(navegacao.push).toHaveBeenCalledWith("/servicos/catalogo/1");
    await user.click(screen.getByRole("button", { name: "Novo serviço" }));
    expect(navegacao.push).toHaveBeenCalledWith("/servicos/catalogo/novo");
  });

  it("mostra o aviso que veio do cadastro e o tira do endereço", async () => {
    navegacao.params = new URLSearchParams("aviso=criado");
    renderWithProviders(<CatalogoServicosPage />);

    expect(await screen.findByText("Serviço cadastrado")).toBeInTheDocument();
    expect(navegacao.replace).toHaveBeenCalledWith("/servicos/catalogo", { scroll: false });
  });

  it("com os serviços desligados, avisa e leva a Configurações (Administrador)", async () => {
    config.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderWithProviders(<CatalogoServicosPage />);

    expect(await screen.findByText("Os serviços estão desligados nesta empresa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ligar em Configurações" })).toHaveAttribute("href", "/configuracoes");
    // O catálogo continua à mão.
    expect(await screen.findByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
  });

  it("quem não configura, com os serviços desligados, é orientado a pedir a quem pode ligar", async () => {
    sessao.atual = { user: { name: "Fábio", perfil: 8 }, isLoading: false };
    config.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderWithProviders(<CatalogoServicosPage />);

    expect(await screen.findByText(/Peça a um administrador ou gerente/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ligar em Configurações" })).not.toBeInTheDocument();
  });
});

describe("CatalogoServicosEsqueleto", () => {
  it("mostra o título certo e um estado de carregamento", () => {
    renderWithProviders(<CatalogoServicosEsqueleto />);

    expect(screen.getByRole("status", { name: "Carregando o catálogo de serviços" })).toBeInTheDocument();
  });
});
