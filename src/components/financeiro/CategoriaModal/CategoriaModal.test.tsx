import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { FinanceiroCategoria } from "@/types/financeiro";

vi.mock("@/lib/api/services/financeiro", () => ({
  listCategorias: vi.fn(),
  createCategoria: vi.fn(),
  updateCategoria: vi.fn(),
}));

import { createCategoria, listCategorias, updateCategoria } from "@/lib/api/services/financeiro";
import { CategoriaModal } from "./CategoriaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function cat(id: number, nome: string, tipo: 1 | 2, extra: Partial<FinanceiroCategoria> = {}): FinanceiroCategoria {
  return { financeiroCategoriaId: id, nome, tipo, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true, ...extra };
}

const categorias = [
  cat(1, "Outras receitas", 1),
  cat(2, "Despesas fixas", 2),
  cat(3, "Aluguel", 2, { financeiroCategoriaPaiId: 2, categoriaPai: "Despesas fixas" }),
  cat(4, "Manutenção", 2),
  cat(5, "Antiga", 2, { ativo: false }),
];

const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

beforeEach(() => {
  vi.mocked(listCategorias).mockReset().mockResolvedValue(categorias);
  vi.mocked(createCategoria).mockReset();
  vi.mocked(updateCategoria).mockReset();
  handlers.onClose.mockReset();
  handlers.onSuccess.mockReset();
});

describe("CategoriaModal: cadastro", () => {
  it("cadastra como despesa por padrão, sem pai, e avisa o sucesso", async () => {
    vi.mocked(createCategoria).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);

    await user.type(screen.getByLabelText("Nome"), "Seguros");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createCategoria).toHaveBeenCalledWith({ nome: "Seguros", tipo: "2", financeiroCategoriaPaiId: "", ativo: true }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Categoria salva."));
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("não envia sem nome e mostra o erro no campo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
    expect(createCategoria).not.toHaveBeenCalled();
  });

  it("não mostra o interruptor de ativa nem o aviso de tipo fixo", () => {
    renderWithProviders(<CategoriaModal {...handlers} />);

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText("O tipo não muda depois de criado.")).not.toBeInTheDocument();
  });

  it("oferece como pai só categorias ativas, do mesmo tipo e sem pai", async () => {
    renderWithProviders(<CategoriaModal {...handlers} />);

    const opcoes = await screen.findByRole("option", { name: "Despesas fixas" });
    const select = opcoes.closest("select")!;
    expect(Array.from(select.options).map((opcao) => opcao.textContent)).toEqual(["Nenhuma (categoria principal)", "Despesas fixas", "Manutenção"]);
  });

  it("trocar o tipo desfaz o pai escolhido e troca as opções", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);
    await screen.findByRole("option", { name: "Despesas fixas" });

    await user.selectOptions(screen.getByLabelText("Categoria pai"), "2");
    expect(screen.getByLabelText("Categoria pai")).toHaveValue("2");

    await user.click(screen.getByRole("radio", { name: "Receita (entrada)" }));

    expect(screen.getByLabelText("Categoria pai")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Outras receitas" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Despesas fixas" })).not.toBeInTheDocument();
  });

  it("nome repetido aparece no campo, não no aviso do topo", async () => {
    vi.mocked(createCategoria).mockRejectedValue(new ApiError("validation", "Já existe uma categoria ativa com esse nome.", 400));
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);

    await user.type(screen.getByLabelText("Nome"), "Aluguel");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Já existe uma categoria ativa com esse nome.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("outro erro do servidor aparece no aviso do topo", async () => {
    vi.mocked(createCategoria).mockRejectedValue(new ApiError("validation", "A categoria pai precisa estar ativa.", 400));
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);

    await user.type(screen.getByLabelText("Nome"), "Seguros");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A categoria pai precisa estar ativa.");
  });

  it("fechar com dados preenchidos pede confirmação antes de descartar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);

    await user.type(screen.getByLabelText("Nome"), "Seguros");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Descartar alterações?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("fechar sem alterações fecha direto", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(handlers.onClose).toHaveBeenCalled();
  });
});

describe("CategoriaModal: edição", () => {
  it("mostra os dados, trava o tipo e oferece o interruptor de ativa", async () => {
    renderWithProviders(<CategoriaModal categoria={categorias[3]} {...handlers} />);

    expect(screen.getByLabelText("Nome")).toHaveValue("Manutenção");
    expect(screen.getByRole("radio", { name: "Despesa (saída)" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Despesa (saída)" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Receita (entrada)" })).toBeDisabled();
    expect(screen.getByText("O tipo não muda depois de criado.")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Categoria ativa" })).toBeChecked();
  });

  it("salva com o id e avisa a atualização", async () => {
    vi.mocked(updateCategoria).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal categoria={categorias[3]} {...handlers} />);

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Manutenção predial");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(updateCategoria).toHaveBeenCalledWith(4, { nome: "Manutenção predial", tipo: "2", financeiroCategoriaPaiId: "", ativo: true }),
    );
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Categoria atualizada."));
  });

  it("inativar explica o efeito", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriaModal categoria={categorias[3]} {...handlers} />);

    await user.click(screen.getByRole("switch", { name: "Categoria ativa" }));

    expect(screen.getByText("Não recebe lançamentos novos. Os lançamentos antigos continuam valendo.")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Categoria inativa" })).toBeInTheDocument();
  });

  it("categoria que agrupa outras não pode virar subcategoria", async () => {
    renderWithProviders(<CategoriaModal categoria={categorias[1]} {...handlers} />);

    expect(await screen.findByText("Esta categoria agrupa outras e não pode virar subcategoria.")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria pai")).toBeDisabled();
  });

  it("não oferece a própria categoria como pai", async () => {
    renderWithProviders(<CategoriaModal categoria={categorias[3]} {...handlers} />);

    await screen.findByRole("option", { name: "Despesas fixas" });
    expect(screen.queryByRole("option", { name: "Manutenção" })).not.toBeInTheDocument();
  });

  it("mantém o pai atual na lista mesmo inativo, marcado como inativa", async () => {
    const lista = [cat(5, "Antiga", 2, { ativo: false }), cat(6, "Filha", 2, { financeiroCategoriaPaiId: 5 })];
    vi.mocked(listCategorias).mockResolvedValue(lista);
    renderWithProviders(<CategoriaModal categoria={lista[1]} {...handlers} />);

    expect(await screen.findByRole("option", { name: "Antiga (inativa)" })).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria pai")).toHaveValue("5");
  });
});
