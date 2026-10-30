import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Lancamento } from "@/types/financeiro";

vi.mock("@/lib/api/services/financeiro", () => ({
  getLancamento: vi.fn(),
  listCategorias: vi.fn(),
}));

import { getLancamento, listCategorias } from "@/lib/api/services/financeiro";
import { LancamentoDetalhe } from "./LancamentoDetalhe";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const lancamento: Lancamento = {
  financeiroLancamentoId: 7,
  financeiroCategoriaId: 3,
  categoria: "Energia",
  categoriaPai: "Despesas fixas",
  tipo: 2,
  descricao: "Conta de luz",
  valor: 450,
  dataPagamento: "2026-10-22",
  formaPagamento: 2,
  favorecido: "Cia. Elétrica",
  documento: null,
  observacao: null,
  peloCaixa: false,
  cancelado: false,
  canceladoPor: null,
};

const handlers = { onClose: vi.fn(), onEditar: vi.fn(), onCancelar: vi.fn() };

function renderDetalhe() {
  return renderWithProviders(<LancamentoDetalhe id={7} {...handlers} />);
}

beforeEach(() => {
  vi.mocked(getLancamento).mockReset();
  vi.mocked(listCategorias).mockReset().mockResolvedValue([]);
  Object.values(handlers).forEach((funcao) => funcao.mockReset());
});

describe("LancamentoDetalhe", () => {
  it("mostra o carregamento e depois todos os campos, com traço nos vazios", async () => {
    vi.mocked(getLancamento).mockResolvedValue(lancamento);
    renderDetalhe();
    expect(screen.getByRole("status", { name: "Carregando lançamento" })).toBeInTheDocument();

    const dialogo = await screen.findByRole("dialog", { name: "Conta de luz" });
    const texto = within(dialogo);
    expect(await texto.findByText("Saída")).toBeInTheDocument();
    expect(texto.getByText("Despesas fixas › Energia")).toBeInTheDocument();
    expect(texto.getByText(/^−\s*R\$\s*450,00$/)).toBeInTheDocument();
    expect(texto.getByText("22/10/2026")).toBeInTheDocument();
    expect(texto.getByText("Pix")).toBeInTheDocument();
    expect(texto.getByText("Pago a")).toBeInTheDocument();
    expect(texto.getByText("Cia. Elétrica")).toBeInTheDocument();
    expect(texto.getAllByText("—")).toHaveLength(2);
    expect(texto.queryByText("Cancelado por")).not.toBeInTheDocument();
  });

  it("entrada chama o favorecido de Recebido de", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ ...lancamento, tipo: 1 });
    renderDetalhe();

    expect(await screen.findByText("Recebido de")).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
  });

  it("marca o lançamento feito pelo caixa", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ ...lancamento, peloCaixa: true });
    renderDetalhe();

    expect(await screen.findByText("Lançado pelo caixa")).toBeInTheDocument();
  });

  it("oferece editar e cancelar, e entrega o lançamento", async () => {
    vi.mocked(getLancamento).mockResolvedValue(lancamento);
    const user = userEvent.setup();
    renderDetalhe();

    await user.click(await screen.findByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));

    expect(handlers.onEditar).toHaveBeenCalledWith(lancamento);
    expect(handlers.onCancelar).toHaveBeenCalledWith(lancamento);
  });

  it("lançamento cancelado mostra quem cancelou e só oferece fechar", async () => {
    vi.mocked(getLancamento).mockResolvedValue({ ...lancamento, cancelado: true, canceladoPor: "Maria" });
    const user = userEvent.setup();
    renderDetalhe();

    expect(await screen.findByText("Cancelado por")).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar lançamento" })).not.toBeInTheDocument();

    // O "X" do cabeçalho do modal também se chama Fechar; o do rodapé é o último.
    await user.click(screen.getAllByRole("button", { name: "Fechar" }).at(-1)!);
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("erro mostra a mensagem e deixa tentar de novo", async () => {
    vi.mocked(getLancamento).mockRejectedValueOnce(new ApiError("not_found", "Lançamento não encontrado.", 404)).mockResolvedValueOnce(lancamento);
    const user = userEvent.setup();
    renderDetalhe();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o lançamento. Lançamento não encontrado.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Cia. Elétrica")).toBeInTheDocument();
  });
});
