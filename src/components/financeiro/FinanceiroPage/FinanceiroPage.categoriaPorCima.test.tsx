import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { FinanceiroCategoria } from "@/types/financeiro";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (chave: string) => (chave === "aba" ? "lancamentos" : null) }),
}));

vi.mock("@/lib/api/services/financeiro", () => ({
  listCategorias: vi.fn(),
  listLancamentos: vi.fn(),
  getLancamento: vi.fn(),
  createLancamento: vi.fn(),
  updateLancamento: vi.fn(),
  cancelarLancamento: vi.fn(),
  createCategoria: vi.fn(),
  updateCategoria: vi.fn(),
  getFluxo: vi.fn(),
}));

vi.mock("@/lib/api/services/caixa", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/services/caixa")>()),
  getTurnoAtual: vi.fn().mockResolvedValue(null),
}));

import { createCategoria, listCategorias, listLancamentos } from "@/lib/api/services/financeiro";
import { FinanceiroPage } from "./FinanceiroPage";

// jsdom não implementa <dialog>; showModal/close só marcam o atributo, como nos outros testes.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function cat(id: number, nome: string, tipo: 1 | 2): FinanceiroCategoria {
  return { financeiroCategoriaId: id, nome, tipo, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true };
}

const pagina = { items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 };

describe("FinanceiroPage: criar categoria por cima do lançamento", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(listLancamentos).mockReset().mockResolvedValue(pagina);
    // Sem categoria de despesa: o formulário oferece "Criar categoria". Depois de criar, a lista passa a ter a nova.
    let criada = false;
    vi.mocked(createCategoria).mockReset().mockImplementation(async () => {
      criada = true;
    });
    vi.mocked(listCategorias).mockReset().mockImplementation(async () => (criada ? [cat(1, "Outras receitas", 1), cat(7, "Seguros", 2)] : [cat(1, "Outras receitas", 1)]));
  });

  it("não troca de aba, mantém o lançamento aberto com os campos e seleciona a categoria nova", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FinanceiroPage />);

    await user.click(screen.getAllByRole("button", { name: "Novo lançamento" })[0]);
    await user.type(await screen.findByLabelText("Descrição"), "Apólice anual");
    await user.click(await screen.findByRole("button", { name: "Criar categoria" }));

    // O modal de categoria abre por cima; o lançamento continua montado.
    await user.type(await screen.findByLabelText("Nome"), "Seguros");
    const dialogCategoria = screen.getByRole("dialog", { name: "Nova categoria" });
    await user.click(within(dialogCategoria).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createCategoria).toHaveBeenCalled());
    const dialogLancamento = screen.getByRole("dialog", { name: "Novo lançamento" });
    await waitFor(() => expect(within(dialogLancamento).getByLabelText("Categoria")).toHaveValue("7"));
    expect(within(dialogLancamento).getByLabelText("Descrição")).toHaveValue("Apólice anual");
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
