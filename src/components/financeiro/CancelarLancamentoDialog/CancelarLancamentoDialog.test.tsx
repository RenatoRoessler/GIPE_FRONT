import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Lancamento } from "@/types/financeiro";

vi.mock("@/lib/api/services/financeiro", () => ({
  listCategorias: vi.fn(),
  cancelarLancamento: vi.fn(),
}));

import { cancelarLancamento, listCategorias } from "@/lib/api/services/financeiro";
import { CancelarLancamentoDialog } from "./CancelarLancamentoDialog";

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
  categoriaPai: null,
  tipo: 2,
  descricao: "Conta de luz",
  valor: 450,
  dataPagamento: "2026-10-22",
  formaPagamento: 2,
  favorecido: null,
  documento: null,
  observacao: null,
  peloCaixa: false,
  cancelado: false,
  canceladoPor: null,
};

const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

beforeEach(() => {
  vi.mocked(listCategorias).mockReset().mockResolvedValue([]);
  vi.mocked(cancelarLancamento).mockReset();
  Object.values(handlers).forEach((funcao) => funcao.mockReset());
});

describe("CancelarLancamentoDialog", () => {
  it("mostra a descrição, o valor com sinal e o que o cancelamento faz", () => {
    renderWithProviders(<CancelarLancamentoDialog lancamento={lancamento} {...handlers} />);

    expect(screen.getByRole("dialog", { name: "Cancelar lançamento?" })).toBeInTheDocument();
    expect(screen.getByText(/Conta de luz · −\s*R\$\s*450,00\. O lançamento fica no histórico como cancelado e sai do fluxo de caixa\./)).toBeInTheDocument();
    expect(screen.queryByText(/gaveta do caixa/)).not.toBeInTheDocument();
  });

  it("numa saída feita pelo caixa, avisa que o dinheiro volta para a gaveta", () => {
    renderWithProviders(<CancelarLancamentoDialog lancamento={{ ...lancamento, peloCaixa: true }} {...handlers} />);

    expect(screen.getByText(/R\$\s*450,00 voltam para a gaveta do caixa\./)).toBeInTheDocument();
  });

  it("numa entrada feita pelo caixa, avisa que o dinheiro sai da gaveta", () => {
    renderWithProviders(<CancelarLancamentoDialog lancamento={{ ...lancamento, tipo: 1, valor: 100, peloCaixa: true }} {...handlers} />);

    expect(screen.getByText(/\+\s*R\$\s*100,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*100,00 saem da gaveta do caixa\./)).toBeInTheDocument();
  });

  it("confirmar cancela, avisa o sucesso e fecha", async () => {
    vi.mocked(cancelarLancamento).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<CancelarLancamentoDialog lancamento={lancamento} {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));

    await waitFor(() => expect(cancelarLancamento).toHaveBeenCalledWith(7));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Lançamento cancelado."));
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("voltar fecha sem cancelar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CancelarLancamentoDialog lancamento={lancamento} {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(handlers.onClose).toHaveBeenCalled();
    expect(cancelarLancamento).not.toHaveBeenCalled();
  });

  it("enquanto cancela, trava os botões", async () => {
    vi.mocked(cancelarLancamento).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<CancelarLancamentoDialog lancamento={lancamento} {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));

    expect(await screen.findByRole("button", { name: "Cancelando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
  });

  it("regra recusada pelo back (caixa já fechado) aparece no diálogo e trava a confirmação", async () => {
    vi.mocked(cancelarLancamento).mockRejectedValue(new ApiError("validation", "O caixa deste lançamento já foi fechado.", 400));
    const user = userEvent.setup();
    renderWithProviders(<CancelarLancamentoDialog lancamento={{ ...lancamento, peloCaixa: true }} {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("O caixa deste lançamento já foi fechado.");
    expect(screen.getByRole("button", { name: "Cancelar lançamento" })).toBeDisabled();
    expect(handlers.onSuccess).not.toHaveBeenCalled();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("falha de rede mostra o erro, mas deixa tentar de novo", async () => {
    vi.mocked(cancelarLancamento).mockRejectedValueOnce(new ApiError("network", "Sem conexão.")).mockResolvedValueOnce();
    const user = userEvent.setup();
    renderWithProviders(<CancelarLancamentoDialog lancamento={lancamento} {...handlers} />);

    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem conexão.");
    expect(screen.getByRole("button", { name: "Cancelar lançamento" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Cancelar lançamento" }));
    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Lançamento cancelado."));
  });

  it("sem o tipo na resposta, usa o da categoria", async () => {
    vi.mocked(listCategorias).mockResolvedValue([{ financeiroCategoriaId: 3, nome: "Energia", tipo: 1, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true }]);
    renderWithProviders(<CancelarLancamentoDialog lancamento={{ ...lancamento, tipo: null, peloCaixa: true }} {...handlers} />);

    expect(await screen.findByText(/saem da gaveta do caixa\./)).toBeInTheDocument();
  });
});
