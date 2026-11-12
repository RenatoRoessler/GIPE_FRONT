import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Servico } from "@/types/servico";

const api = vi.hoisted(() => ({ listServicos: vi.fn(), criarServico: vi.fn(), atualizarServico: vi.fn(), inativarServico: vi.fn() }));
vi.mock("@/lib/api/services/servico", () => api);

const sessao = vi.hoisted(() => ({ atual: { user: { name: "Ana", perfil: 1 }, isLoading: false } }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

const navegacao = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), params: new URLSearchParams(), celular: false }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navegacao.push, replace: navegacao.replace }),
  usePathname: () => "/servicos",
  useSearchParams: () => navegacao.params,
}));
vi.mock("@/hooks/useMediaQuery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useMediaQuery")>()),
  useIsMobile: () => navegacao.celular,
}));

import { ServicosMasterDetail } from "./ServicosMasterDetail";

const servico = (id: number, nome: string, extra: Partial<Servico> = {}): Servico => ({
  id,
  nome,
  descricao: null,
  duracaoMinutos: 60,
  tempoPermitidoMinutos: 180,
  ativo: true,
  precos: [{ categoria: 99, descricao: "Todas", valorCentavos: 5000 }],
  ...extra,
});

const LISTA = [
  servico(1, "Lavagem completa", { descricao: "Externa e interna" }),
  servico(2, "Polimento", { precos: [{ categoria: 2, descricao: "Carro pequeno", valorCentavos: 8000 }] }),
  servico(3, "Cera antiga", { ativo: false }),
];

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
  navegacao.params = new URLSearchParams("aba=catalogo");
  navegacao.celular = false;
  sessao.atual = { user: { name: "Ana", perfil: 1 }, isLoading: false };
  api.listServicos.mockResolvedValue(LISTA);
});

describe("ServicosMasterDetail: lista", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    api.listServicos.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ServicosMasterDetail />);

    expect(screen.getByRole("status", { name: "Carregando o catálogo" })).toBeInTheDocument();
  });

  it("lista só os ativos por padrão, com a contagem", async () => {
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Polimento/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cera antiga/ })).not.toBeInTheDocument();
    expect(screen.getByText("2 serviços")).toBeInTheDocument();
  });

  it("o filtro de situação mostra os inativos e todos", async () => {
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("button", { name: /Lavagem completa/ });

    await userEvent.selectOptions(screen.getByLabelText("Situação"), "inativos");
    expect(screen.getByRole("button", { name: /Cera antiga/ })).toBeInTheDocument();
    expect(screen.getByText("1 serviço")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Situação"), "todos");
    expect(screen.getByText("3 serviços")).toBeInTheDocument();
  });

  it("busca pelo nome sem diferenciar acento ou caixa, e Esc limpa", async () => {
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("button", { name: /Lavagem completa/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar serviço" }), "POLIMENTO");
    expect(screen.queryByRole("button", { name: /Lavagem completa/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Polimento/ })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
  });

  it("sem resultado, avisa e o botão limpa a busca e mostra todos", async () => {
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("button", { name: /Lavagem completa/ });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar serviço" }), "xyz");
    expect(screen.getByText("Nenhum serviço encontrado.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(screen.getByText("3 serviços")).toBeInTheDocument();
  });

  it("catálogo vazio de verdade tem o seu aviso", async () => {
    api.listServicos.mockResolvedValue([]);
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByText("Nenhum serviço cadastrado.")).toBeInTheDocument();
  });

  it("erro mostra a mensagem e tenta de novo", async () => {
    api.listServicos.mockRejectedValueOnce(new ApiError("server")).mockResolvedValue(LISTA);
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
  });

  it("no 403 avisa da permissão e não oferece nova tentativa", async () => {
    api.listServicos.mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("as setas movem o foco entre os itens", async () => {
    renderWithProviders(<ServicosMasterDetail />);
    const primeiro = await screen.findByRole("button", { name: /Lavagem completa/ });

    primeiro.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: /Polimento/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(primeiro).toHaveFocus();
  });
});

describe("ServicosMasterDetail: seleção e detalhe", () => {
  it("na tela larga, sem seleção no endereço, abre o primeiro da lista", async () => {
    renderWithProviders(<ServicosMasterDetail />);

    const detalhe = await screen.findByRole("article");
    expect(within(detalhe).getByRole("heading", { name: "Lavagem completa" })).toBeInTheDocument();
    expect(within(detalhe).getByText("Externa e interna")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lavagem completa/ })).toHaveAttribute("aria-current", "true");
  });

  it("escolher um item atualiza o endereço sem perder a aba", async () => {
    renderWithProviders(<ServicosMasterDetail />);

    await userEvent.click(await screen.findByRole("button", { name: /Polimento/ }));

    expect(navegacao.push).toHaveBeenCalledWith("/servicos?aba=catalogo&servico=2", { scroll: false });
  });

  it("o serviço do endereço é o aberto, mesmo inativo e fora do filtro", async () => {
    navegacao.params = new URLSearchParams("aba=catalogo&servico=3");
    renderWithProviders(<ServicosMasterDetail />);

    const detalhe = await screen.findByRole("article");
    expect(within(detalhe).getByRole("heading", { name: "Cera antiga" })).toBeInTheDocument();
    expect(within(detalhe).getByText(/Serviço inativo: não pode ser acrescentado a veículos/)).toBeInTheDocument();
  });

  it("mostra os tempos e os preços por categoria", async () => {
    navegacao.params = new URLSearchParams("aba=catalogo&servico=2");
    renderWithProviders(<ServicosMasterDetail />);

    const detalhe = await screen.findByRole("article");
    expect(within(detalhe).getByText("60 min · 1 h")).toBeInTheDocument();
    expect(within(detalhe).getByText("180 min · 3 h")).toBeInTheDocument();
    const precos = within(detalhe).getByRole("list", { name: "Preços por categoria" });
    expect(within(precos).getAllByRole("listitem")).toHaveLength(6);
    expect(within(precos).getByText("R$ 80,00")).toBeInTheDocument();
    expect(within(precos).getAllByText("Não atende")).toHaveLength(5);
  });

  it("serviço só com o preço geral mostra uma linha", async () => {
    navegacao.params = new URLSearchParams("aba=catalogo&servico=1");
    renderWithProviders(<ServicosMasterDetail />);

    const precos = within(await screen.findByRole("article")).getByRole("list", { name: "Preços por categoria" });
    expect(within(precos).getAllByRole("listitem")).toHaveLength(1);
    expect(within(precos).getByText("Todas as categorias")).toBeInTheDocument();
    expect(within(precos).getByText("R$ 50,00")).toBeInTheDocument();
  });

  it("sem tempo permitido diz isso em texto", async () => {
    api.listServicos.mockResolvedValue([servico(1, "Cera", { tempoPermitidoMinutos: null })]);
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByText("Sem tempo permitido")).toBeInTheDocument();
  });

  it("serviço do endereço que não existe mais avisa e volta para a lista", async () => {
    navegacao.params = new URLSearchParams("aba=catalogo&servico=99");
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByText("Este serviço não existe mais.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver os serviços" }));
    expect(navegacao.replace).toHaveBeenCalledWith("/servicos?aba=catalogo", { scroll: false });
  });
});

describe("ServicosMasterDetail: celular", () => {
  beforeEach(() => {
    navegacao.celular = true;
  });

  it("sem seleção mostra só a lista", async () => {
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByRole("button", { name: /Lavagem completa/ })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("com seleção mostra só o detalhe, com o botão de voltar à lista", async () => {
    navegacao.params = new URLSearchParams("aba=catalogo&servico=2");
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByRole("article")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Serviços" }));
    expect(navegacao.replace).toHaveBeenCalledWith("/servicos?aba=catalogo", { scroll: false });
  });
});

describe("ServicosMasterDetail: manutenção do catálogo", () => {
  it("o Administrador cadastra: abre o formulário, grava, avisa e seleciona o novo serviço", async () => {
    api.criarServico.mockResolvedValue(servico(9, "Higienização"));
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("button", { name: /Lavagem completa/ });

    await userEvent.click(screen.getByRole("button", { name: "Novo serviço" }));
    const dialogo = await screen.findByRole("dialog", { name: "Novo serviço" });
    await userEvent.type(within(dialogo).getByLabelText("Nome"), "Higienização");
    await userEvent.type(within(dialogo).getByLabelText("Todas as categorias"), "70");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Serviço criado.")).toBeInTheDocument();
    expect(api.criarServico).toHaveBeenCalledWith(expect.objectContaining({ nome: "Higienização", precos: [{ categoria: 99, valor: 70 }] }));
    expect(navegacao.push).toHaveBeenCalledWith("/servicos?aba=catalogo&servico=9", { scroll: false });
  });

  it("Editar abre o formulário com os dados do serviço e avisa ao gravar", async () => {
    api.atualizarServico.mockResolvedValue(servico(1, "Lavagem completa"));
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("article");

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Editar serviço" });
    expect(within(dialogo).getByLabelText("Nome")).toHaveValue("Lavagem completa");
    expect(within(dialogo).getByLabelText("Todas as categorias")).toHaveValue("50,00");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Serviço atualizado.")).toBeInTheDocument();
    expect(api.atualizarServico).toHaveBeenCalledWith(1, expect.objectContaining({ nome: "Lavagem completa" }));
  });

  it("Inativar pede confirmação, inativa e avisa; cancelar não faz nada", async () => {
    api.inativarServico.mockResolvedValue(undefined);
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("article");

    await userEvent.click(screen.getByRole("button", { name: "Inativar" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(api.inativarServico).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Inativar" }));
    const dialogo = await screen.findByRole("dialog", { name: "Inativar Lavagem completa?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Inativar" }));

    expect(await screen.findByText("Serviço inativado.")).toBeInTheDocument();
    expect(api.inativarServico).toHaveBeenCalledWith(1);
  });

  it("serviço já inativo não oferece Inativar", async () => {
    navegacao.params = new URLSearchParams("aba=catalogo&servico=3");
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("article");

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inativar" })).not.toBeInTheDocument();
  });

  it("quem não mantém o catálogo só vê: sem Novo serviço, Editar nem Inativar", async () => {
    sessao.atual = { user: { name: "Beto", perfil: 4 }, isLoading: false };
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("article");

    expect(screen.queryByRole("button", { name: "Novo serviço" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inativar" })).not.toBeInTheDocument();
  });

  it("catálogo vazio oferece o primeiro cadastro a quem pode", async () => {
    api.listServicos.mockResolvedValue([]);
    renderWithProviders(<ServicosMasterDetail />);

    expect(await screen.findByText("Nenhum serviço cadastrado.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Novo serviço" }).length).toBeGreaterThan(0);
  });

  it("erro ao inativar vira aviso de erro", async () => {
    api.inativarServico.mockRejectedValue(new ApiError("server"));
    renderWithProviders(<ServicosMasterDetail />);
    await screen.findByRole("article");

    await userEvent.click(screen.getByRole("button", { name: "Inativar" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Inativar" }));

    expect(await screen.findByText("Erro no servidor. Tente novamente em instantes.")).toBeInTheDocument();
  });
});
