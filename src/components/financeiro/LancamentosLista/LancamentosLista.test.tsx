import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { FinanceiroCategoria, Lancamento } from "@/types/financeiro";

const replace = vi.fn();
let consulta = "";
let mobile = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(consulta),
}));

vi.mock("@/hooks/useMediaQuery", () => ({ useIsMobile: () => mobile, useMediaQuery: () => false }));

vi.mock("@/lib/api/services/financeiro", () => ({
  LANCAMENTOS_POR_PAGINA: 20,
  listLancamentos: vi.fn(),
  listCategorias: vi.fn(),
}));

import { listCategorias, listLancamentos } from "@/lib/api/services/financeiro";
import { LancamentosLista } from "./LancamentosLista";

function cat(id: number, nome: string, tipo: 1 | 2, extra: Partial<FinanceiroCategoria> = {}): FinanceiroCategoria {
  return { financeiroCategoriaId: id, nome, tipo, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true, ...extra };
}

const categorias = [
  cat(1, "Outras receitas", 1),
  cat(2, "Despesas fixas", 2),
  cat(3, "Energia", 2, { financeiroCategoriaPaiId: 2, categoriaPai: "Despesas fixas" }),
];

function lancamento(id: number, extra: Partial<Lancamento> = {}): Lancamento {
  return {
    financeiroLancamentoId: id,
    financeiroCategoriaId: 3,
    categoria: "Energia",
    categoriaPai: "Despesas fixas",
    tipo: 2,
    descricao: "Conta de luz",
    valor: 450,
    dataPagamento: "2026-10-22",
    formaPagamento: 2,
    favorecido: "Cia. Elétrica",
    documento: "NF 1234",
    observacao: null,
    peloCaixa: false,
    cancelado: false,
    canceladoPor: null,
    ...extra,
  };
}

const pagina = (items: Lancamento[], extra: Partial<{ page: number; totalPages: number; totalRecords: number }> = {}) => ({
  items,
  page: 1,
  pageSize: 20,
  totalRecords: items.length,
  totalPages: items.length > 0 ? 1 : 0,
  ...extra,
});

const handlers = { onNovo: vi.fn(), onVerDetalhe: vi.fn(), onEditar: vi.fn(), onCancelar: vi.fn(), onCriarCategoria: vi.fn() };

beforeEach(() => {
  replace.mockReset();
  consulta = "";
  mobile = false;
  vi.mocked(listLancamentos).mockReset();
  vi.mocked(listCategorias).mockReset().mockResolvedValue(categorias);
  Object.values(handlers).forEach((funcao) => funcao.mockReset());
});

describe("LancamentosLista: lista", () => {
  it("mostra o carregamento enquanto busca", () => {
    vi.mocked(listLancamentos).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(screen.getByRole("status", { name: "Carregando lançamentos" })).toBeInTheDocument();
  });

  it("mostra data, descrição com favorecido e documento, categoria com pai, forma e valor com sinal", async () => {
    vi.mocked(listLancamentos).mockResolvedValue(pagina([lancamento(1), lancamento(2, { descricao: "Troco", tipo: 1, valor: 100, categoria: "Outras receitas", categoriaPai: null, favorecido: null, documento: null })]));
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findAllByText("22/10/2026", { selector: "td" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Conta de luz" })).toBeInTheDocument();
    expect(screen.getByText("Cia. Elétrica · NF 1234")).toBeInTheDocument();
    expect(screen.getByText("Despesas fixas › Energia")).toBeInTheDocument();
    expect(screen.getAllByText("Pix")).not.toHaveLength(0);
    expect(screen.getByText(/^−\s*R\$\s*450,00$/)).toBeInTheDocument();
    expect(screen.getByText(/^\+\s*R\$\s*100,00$/)).toBeInTheDocument();
  });

  it("sem o tipo na resposta, usa o da categoria para o sinal", async () => {
    vi.mocked(listLancamentos).mockResolvedValue(pagina([lancamento(1, { tipo: null })]));
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText(/^−\s*R\$\s*450,00$/)).toBeInTheDocument();
  });

  it("marca os lançamentos feitos pelo caixa", async () => {
    vi.mocked(listLancamentos).mockResolvedValue(pagina([lancamento(1, { peloCaixa: true })]));
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText("Pelo caixa")).toBeInTheDocument();
  });

  it("lançamento cancelado leva o selo e não tem ações", async () => {
    consulta = "cancelados=1";
    vi.mocked(listLancamentos).mockResolvedValue(pagina([lancamento(1), lancamento(2, { descricao: "Aluguel", cancelado: true })]));
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText("Cancelado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Conta de luz" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Aluguel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar Aluguel" })).not.toBeInTheDocument();
    expect(listLancamentos).toHaveBeenCalledWith(expect.objectContaining({ incluirCancelados: true }));
  });

  it("a descrição abre o detalhe e os ícones editam e cancelam", async () => {
    const item = lancamento(1);
    vi.mocked(listLancamentos).mockResolvedValue(pagina([item]));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);

    await user.click(await screen.findByRole("button", { name: "Conta de luz" }));
    await user.click(screen.getByRole("button", { name: "Editar Conta de luz" }));
    await user.click(screen.getByRole("button", { name: "Cancelar Conta de luz" }));

    expect(handlers.onVerDetalhe).toHaveBeenCalledWith(item);
    expect(handlers.onEditar).toHaveBeenCalledWith(item);
    expect(handlers.onCancelar).toHaveBeenCalledWith(item);
  });

  it("lê os filtros da URL e os usa na consulta", async () => {
    consulta = "lde=2026-10-01&late=2026-10-31&tipo=saida&categoria=2&pagina=2";
    vi.mocked(listLancamentos).mockResolvedValue(pagina([lancamento(1)], { page: 2, totalPages: 3, totalRecords: 45 }));
    renderWithProviders(<LancamentosLista {...handlers} />);

    await screen.findByRole("button", { name: "Conta de luz" });
    expect(listLancamentos).toHaveBeenCalledWith({ de: "2026-10-01", ate: "2026-10-31", tipo: 2, financeiroCategoriaId: 2, incluirCancelados: false, pagina: 2 });
  });
});

describe("LancamentosLista: filtros", () => {
  async function abrir(items = [lancamento(1)], extra = {}) {
    vi.mocked(listLancamentos).mockResolvedValue(pagina(items, extra));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);
    await screen.findByRole("button", { name: "Conta de luz" });
    return user;
  }

  it("escolher o tipo atualiza a URL e volta para a primeira página", async () => {
    consulta = "pagina=3";
    const user = await abrir(undefined, { page: 3, totalPages: 3, totalRecords: 41 });

    await user.click(screen.getByRole("radio", { name: "Saídas" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos&tipo=saida", { scroll: false });
  });

  it("escolher a categoria filtra, e uma categoria pai avisa que inclui as subcategorias", async () => {
    const user = await abrir();

    await user.selectOptions(screen.getByLabelText("Categoria"), "2");

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos&categoria=2", { scroll: false });
  });

  it("mostra a dica de subcategorias só quando a categoria escolhida é pai", async () => {
    consulta = "categoria=2";
    await abrir();
    expect(screen.getByText("Inclui as subcategorias.")).toBeInTheDocument();
  });

  it("a lista de categorias respeita o tipo escolhido", async () => {
    consulta = "tipo=entrada";
    await abrir();

    const select = screen.getByLabelText("Categoria") as HTMLSelectElement;
    expect(Array.from(select.options).map((opcao) => opcao.textContent)).toEqual(["Todas as categorias", "Outras receitas"]);
  });

  it("trocar o tipo desfaz a categoria que é de outro tipo", async () => {
    consulta = "tipo=saida&categoria=2";
    const user = await abrir();

    await user.click(screen.getByRole("radio", { name: "Entradas" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos&tipo=entrada", { scroll: false });
  });

  it("mostrar cancelados vai para a URL", async () => {
    const user = await abrir();

    await user.click(screen.getByRole("switch", { name: "Mostrar cancelados" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos&cancelados=1", { scroll: false });
  });

  it("o período é opcional e vai para a URL com lde e late", async () => {
    const user = await abrir();

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-31" } });
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos&lde=2026-10-01&late=2026-10-31", { scroll: false });
  });

  it("sem filtro ativo, não oferece limpar filtros", async () => {
    await abrir();

    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
  });

  it("com filtro ativo, limpar filtros volta ao endereço da aba", async () => {
    consulta = "tipo=saida&cancelados=1&pagina=2";
    const user = await abrir(undefined, { page: 2, totalPages: 2, totalRecords: 21 });

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos", { scroll: false });
  });

  it("no celular, os filtros ficam num bloco com a contagem dos ativos", async () => {
    mobile = true;
    consulta = "tipo=saida&cancelados=1";
    await abrir();

    expect(screen.getByRole("button", { name: /Filtros · 2/ })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("LancamentosLista: paginação", () => {
  it("ir para a próxima página atualiza a URL e mantém os filtros", async () => {
    consulta = "tipo=saida";
    vi.mocked(listLancamentos).mockResolvedValue(pagina([lancamento(1)], { totalPages: 3, totalRecords: 45 }));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);

    await user.click(await screen.findByRole("button", { name: "Próxima" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos&tipo=saida&pagina=2", { scroll: false });
  });

  it("página fora do intervalo volta à última existente", async () => {
    consulta = "pagina=5";
    vi.mocked(listLancamentos).mockResolvedValue(pagina([], { page: 5, totalPages: 2, totalRecords: 30 }));
    renderWithProviders(<LancamentosLista {...handlers} />);

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/financeiro?aba=lancamentos&pagina=2", { scroll: false }));
  });
});

describe("LancamentosLista: estados", () => {
  it("sem nenhum lançamento, convida a lançar", async () => {
    vi.mocked(listLancamentos).mockResolvedValue(pagina([]));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText("Nenhum lançamento ainda.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Novo lançamento" }));
    expect(handlers.onNovo).toHaveBeenCalled();
  });

  it("sem categoria ativa, pede para criar uma antes de lançar", async () => {
    vi.mocked(listCategorias).mockResolvedValue([]);
    vi.mocked(listLancamentos).mockResolvedValue(pagina([]));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText("Crie uma categoria de receita ou despesa antes de lançar.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo lançamento" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar categoria" }));
    expect(handlers.onCriarCategoria).toHaveBeenCalled();
  });

  it("com filtros e sem resultado, oferece limpar", async () => {
    consulta = "tipo=entrada";
    vi.mocked(listLancamentos).mockResolvedValue(pagina([]));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText("Nenhum lançamento com esses filtros.")).toBeInTheDocument();
    const vazio = screen.getByText("Nenhum lançamento com esses filtros.").parentElement!;
    await user.click(within(vazio).getByRole("button", { name: "Limpar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos", { scroll: false });
  });

  it("erro de carregamento mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(listLancamentos).mockRejectedValueOnce(new ApiError("server", "Falha no servidor.", 500)).mockResolvedValueOnce(pagina([lancamento(1)]));
    const user = userEvent.setup();
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os lançamentos. Falha no servidor.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("button", { name: "Conta de luz" })).toBeInTheDocument();
  });

  it("403 mostra o aviso de permissão, sem tentar de novo", async () => {
    vi.mocked(listLancamentos).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<LancamentosLista {...handlers} />);

    expect(await screen.findByText(/permiss/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
