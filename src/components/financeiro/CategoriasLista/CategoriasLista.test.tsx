import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { FinanceiroCategoria } from "@/types/financeiro";

vi.mock("@/lib/api/services/financeiro", () => ({ listCategorias: vi.fn() }));

import { listCategorias } from "@/lib/api/services/financeiro";
import { CategoriasLista } from "./CategoriasLista";

function cat(id: number, nome: string, tipo: 1 | 2, extra: Partial<FinanceiroCategoria> = {}): FinanceiroCategoria {
  return { financeiroCategoriaId: id, nome, tipo, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true, ...extra };
}

const categorias = [
  cat(1, "Outras receitas", 1),
  cat(2, "Despesas fixas", 2),
  cat(3, "Aluguel", 2, { financeiroCategoriaPaiId: 2, categoriaPai: "Despesas fixas" }),
  cat(4, "Energia", 2, { financeiroCategoriaPaiId: 2, categoriaPai: "Despesas fixas", ativo: false }),
  cat(5, "Manutenção", 2, { ativo: false }),
];

const handlers = { onNova: vi.fn(), onEditar: vi.fn() };

beforeEach(() => {
  vi.mocked(listCategorias).mockReset();
  handlers.onNova.mockReset();
  handlers.onEditar.mockReset();
});

describe("CategoriasLista", () => {
  it("mostra um carregamento enquanto busca", () => {
    vi.mocked(listCategorias).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<CategoriasLista {...handlers} />);

    expect(screen.getByRole("status", { name: "Carregando categorias" })).toBeInTheDocument();
  });

  it("separa receitas e despesas, com as filhas recuadas, e mostra só as ativas por padrão", async () => {
    vi.mocked(listCategorias).mockResolvedValue(categorias);
    renderWithProviders(<CategoriasLista {...handlers} />);

    const receitas = await screen.findByRole("region", { name: "Receitas" });
    const despesas = screen.getByRole("region", { name: "Despesas" });
    expect(within(receitas).getByText("Outras receitas")).toBeInTheDocument();
    expect(within(despesas).getByText("Despesas fixas")).toBeInTheDocument();
    expect(within(despesas).getByText("Aluguel")).toBeInTheDocument();
    expect(within(despesas).queryByText("Energia")).not.toBeInTheDocument();
    expect(within(despesas).queryByText("Manutenção")).not.toBeInTheDocument();
  });

  it("a situação mostra as inativas ou todas", async () => {
    vi.mocked(listCategorias).mockResolvedValue(categorias);
    const user = userEvent.setup();
    renderWithProviders(<CategoriasLista {...handlers} />);
    await screen.findByRole("region", { name: "Despesas" });

    await user.selectOptions(screen.getByLabelText("Situação"), "inativas");
    const despesas = screen.getByRole("region", { name: "Despesas" });
    expect(within(despesas).getByText("Energia")).toBeInTheDocument();
    expect(within(despesas).getByText("Manutenção")).toBeInTheDocument();
    expect(within(despesas).queryByText("Aluguel")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Receitas" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Situação"), "todas");
    expect(within(screen.getByRole("region", { name: "Despesas" })).getAllByRole("row")).toHaveLength(5);
  });

  it("o filtro de tipo mostra só receitas ou só despesas", async () => {
    vi.mocked(listCategorias).mockResolvedValue(categorias);
    const user = userEvent.setup();
    renderWithProviders(<CategoriasLista {...handlers} />);
    await screen.findByRole("region", { name: "Despesas" });

    await user.click(screen.getByRole("radio", { name: "Receitas" }));
    expect(screen.getByRole("region", { name: "Receitas" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Despesas" })).not.toBeInTheDocument();
  });

  it("filtros sem resultado oferecem limpar", async () => {
    vi.mocked(listCategorias).mockResolvedValue([cat(1, "Outras receitas", 1)]);
    const user = userEvent.setup();
    renderWithProviders(<CategoriasLista {...handlers} />);
    await screen.findByRole("region", { name: "Receitas" });

    await user.click(screen.getByRole("radio", { name: "Despesas" }));
    expect(screen.getByText("Nenhuma categoria com esses filtros.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByRole("region", { name: "Receitas" })).toBeInTheDocument();
  });

  it("sem nenhuma categoria, o estado vazio leva a criar a primeira", async () => {
    vi.mocked(listCategorias).mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<CategoriasLista {...handlers} />);

    expect(await screen.findByText("Nenhuma categoria cadastrada.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nova categoria" }));
    expect(handlers.onNova).toHaveBeenCalled();
  });

  it("editar entrega a categoria da linha", async () => {
    vi.mocked(listCategorias).mockResolvedValue(categorias);
    const user = userEvent.setup();
    renderWithProviders(<CategoriasLista {...handlers} />);
    await screen.findByRole("region", { name: "Despesas" });

    await user.click(screen.getByRole("button", { name: "Editar Aluguel" }));

    expect(handlers.onEditar).toHaveBeenCalledWith(categorias[2]);
  });

  it("o estado da categoria aparece em texto", async () => {
    vi.mocked(listCategorias).mockResolvedValue(categorias);
    renderWithProviders(<CategoriasLista {...handlers} />);

    expect(await screen.findAllByText("Ativa")).not.toHaveLength(0);
    expect(screen.queryByText("Inativa")).not.toBeInTheDocument();
  });

  it("erro de carregamento mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(listCategorias).mockRejectedValueOnce(new ApiError("server", "Falha no servidor.", 500)).mockResolvedValueOnce(categorias);
    const user = userEvent.setup();
    renderWithProviders(<CategoriasLista {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as categorias. Falha no servidor.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("region", { name: "Despesas" })).toBeInTheDocument();
  });

  it("403 mostra o aviso de permissão, sem tentar de novo", async () => {
    vi.mocked(listCategorias).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<CategoriasLista {...handlers} />);

    expect(await screen.findByText(/permiss/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
