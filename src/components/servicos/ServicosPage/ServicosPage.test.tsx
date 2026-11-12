import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const servico = vi.hoisted(() => ({ getConfiguracao: vi.fn(), updateConfiguracao: vi.fn() }));
vi.mock("@/lib/api/services/configuracao", () => servico);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

const navegacao = vi.hoisted(() => ({ replace: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navegacao.replace }),
  usePathname: () => "/servicos",
  useSearchParams: () => navegacao.params,
}));

// A fila e o catálogo têm os seus próprios testes: aqui só importa qual deles a página escolhe.
vi.mock("../FilaServicos", () => ({ FilaServicos: () => <p>conteúdo da fila</p> }));
vi.mock("../ServicosMasterDetail", () => ({ ServicosMasterDetail: () => <p>conteúdo do catálogo</p> }));

import { abaDaUrl, ServicosEsqueleto, ServicosPage } from "./ServicosPage";

const CONFIG = { modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: true, alteradoPorId: null, alteradoEm: null };

function entrar(perfil: number, aba?: string) {
  sessao.atual = { user: { name: "Ana", perfil }, isLoading: false };
  navegacao.params = new URLSearchParams(aba ? { aba } : {});
}

beforeEach(() => {
  vi.clearAllMocks();
  servico.getConfiguracao.mockResolvedValue(CONFIG);
  entrar(1);
});

describe("abaDaUrl", () => {
  const gerente = { podeVerCatalogo: true, abrePeloCatalogo: true };

  it("usa a aba do endereço, quando existe", () => {
    expect(abaDaUrl("fila", gerente)).toBe("fila");
    expect(abaDaUrl("catalogo", { podeVerCatalogo: true, abrePeloCatalogo: false })).toBe("catalogo");
  });

  it("sem aba ou com aba inválida, abre pela padrão do perfil", () => {
    expect(abaDaUrl(null, gerente)).toBe("catalogo");
    expect(abaDaUrl("xyz", gerente)).toBe("catalogo");
    expect(abaDaUrl(null, { podeVerCatalogo: true, abrePeloCatalogo: false })).toBe("fila");
  });

  it("quem não vê o catálogo fica sempre na fila", () => {
    expect(abaDaUrl("catalogo", { podeVerCatalogo: false, abrePeloCatalogo: false })).toBe("fila");
  });
});

describe("ServicosPage", () => {
  it("o Administrador abre no catálogo e vê as duas abas", async () => {
    renderWithProviders(<ServicosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Serviços" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Catálogo" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Fila" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("conteúdo do catálogo")).toBeInTheDocument();
  });

  it("a aba do endereço vale: ?aba=fila mostra a fila", () => {
    entrar(1, "fila");
    renderWithProviders(<ServicosPage />);

    expect(screen.getByRole("tab", { name: "Fila" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("conteúdo da fila")).toBeInTheDocument();
  });

  it("o Caixa abre na fila, mas também enxerga o catálogo", () => {
    entrar(4);
    renderWithProviders(<ServicosPage />);

    expect(screen.getByRole("tab", { name: "Fila" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Catálogo" })).toBeInTheDocument();
  });

  it("o Lavador só tem a fila, sem abas, mesmo pedindo o catálogo no endereço", () => {
    entrar(9, "catalogo");
    renderWithProviders(<ServicosPage />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("conteúdo da fila")).toBeInTheDocument();
    expect(screen.queryByText("conteúdo do catálogo")).not.toBeInTheDocument();
  });

  it("trocar de aba muda o endereço e descarta o resto dos parâmetros", async () => {
    renderWithProviders(<ServicosPage />);

    await userEvent.click(screen.getByRole("tab", { name: "Fila" }));

    expect(navegacao.replace).toHaveBeenCalledWith("/servicos?aba=fila", { scroll: false });
  });

  it("com os serviços desligados, avisa e leva a Configurações (Administrador)", async () => {
    servico.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderWithProviders(<ServicosPage />);

    expect(await screen.findByText("Os serviços estão desligados nesta empresa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ligar em Configurações" })).toHaveAttribute("href", "/configuracoes");
    // O módulo continua à mão.
    expect(screen.getByText("conteúdo do catálogo")).toBeInTheDocument();
  });

  it("com os serviços desligados, quem não configura é orientado a pedir a quem pode", async () => {
    entrar(4);
    servico.getConfiguracao.mockResolvedValue({ ...CONFIG, servicos: false });
    renderWithProviders(<ServicosPage />);

    expect(await screen.findByText(/Peça a um administrador ou gerente/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ligar em Configurações" })).not.toBeInTheDocument();
  });

  it("com os serviços ligados, ou antes de a configuração chegar, não mostra o aviso", async () => {
    renderWithProviders(<ServicosPage />);
    expect(screen.queryByText("Os serviços estão desligados nesta empresa")).not.toBeInTheDocument();

    await screen.findByText("conteúdo do catálogo");
    expect(servico.getConfiguracao).toHaveBeenCalled();
    expect(screen.queryByText("Os serviços estão desligados nesta empresa")).not.toBeInTheDocument();
  });
});

describe("ServicosEsqueleto", () => {
  it("mostra o título e um estado de carregamento", () => {
    renderWithProviders(<ServicosEsqueleto />);

    expect(screen.getByRole("heading", { level: 1, name: "Serviços" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Carregando os serviços" })).toBeInTheDocument();
  });
});
