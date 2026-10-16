import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { MensalistaTipo } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  createTipoMensalidade: vi.fn(),
  updateTipoMensalidade: vi.fn(),
}));

import { createTipoMensalidade, updateTipoMensalidade } from "@/lib/api/services/mensalista";
import { TipoModal } from "./TipoModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

const noturno: MensalistaTipo = {
  mensalistaTipoId: 4,
  tipoMensal: "Noturno",
  categoria: 2,
  valorMensalidade: 199.9,
  horarioEntrada: "19:00:00",
  horarioSaida: "07:00:00",
  ativo: true,
};

async function preencherCadastro(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome do tipo"), "Diurno");
  await user.selectOptions(screen.getByLabelText("Categoria"), "99");
  await user.type(screen.getByLabelText("Valor da mensalidade (R$)"), "280,00");
}

describe("TipoModal", () => {
  beforeEach(() => {
    vi.mocked(createTipoMensalidade).mockReset();
    vi.mocked(updateTipoMensalidade).mockReset();
    handlers.onClose.mockReset();
    handlers.onSuccess.mockReset();
  });

  it("não envia com valor 0 e mostra o erro no campo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await user.type(screen.getByLabelText("Nome do tipo"), "Diurno");
    await user.selectOptions(screen.getByLabelText("Categoria"), "99");
    await user.type(screen.getByLabelText("Valor da mensalidade (R$)"), "0");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("O valor deve ser maior que zero")).toBeInTheDocument();
    expect(createTipoMensalidade).not.toHaveBeenCalled();
  });

  it("não envia com só um horário preenchido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await preencherCadastro(user);
    await user.type(screen.getByLabelText("Horário de entrada"), "07:00");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Informe o horário de saída")).toBeInTheDocument();
    expect(createTipoMensalidade).not.toHaveBeenCalled();
  });

  it("cadastra o tipo ativo e avisa o sucesso", async () => {
    vi.mocked(createTipoMensalidade).mockResolvedValue({ mensalistaTipoId: 9 });
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await preencherCadastro(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Tipo criado."));
    expect(vi.mocked(createTipoMensalidade).mock.calls[0][0]).toMatchObject({
      tipoMensal: "Diurno",
      categoria: "99",
      valorMensalidade: "280,00",
      ativo: true,
    });
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("na edição preenche os valores e envia ativo=false ao desativar", async () => {
    vi.mocked(updateTipoMensalidade).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<TipoModal tipo={noturno} {...handlers} />);

    expect(screen.getByLabelText("Nome do tipo")).toHaveValue("Noturno");
    expect(screen.getByLabelText("Valor da mensalidade (R$)")).toHaveValue("199,90");
    expect(screen.getByLabelText("Horário de entrada")).toHaveValue("19:00");

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(handlers.onSuccess).toHaveBeenCalledWith("Tipo atualizado."));
    expect(updateTipoMensalidade).toHaveBeenCalledWith(4, expect.objectContaining({ ativo: false }));
  });

  it("mostra o erro do servidor no banner", async () => {
    vi.mocked(createTipoMensalidade).mockRejectedValue(new ApiError("validation", "Dados inválidos."));
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await preencherCadastro(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Dados inválidos.");
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("mostra a duplicidade no campo nome", async () => {
    vi.mocked(createTipoMensalidade).mockRejectedValue(
      new ApiError("validation", "Já existe um tipo ativo com o mesmo nome e categoria."),
    );
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await preencherCadastro(user);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Já existe um tipo ativo com esse nome e categoria.")).toBeInTheDocument();
  });

  it("pede confirmação ao descartar com alterações", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await user.type(screen.getByLabelText("Nome do tipo"), "Diurno");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByText("Descartar alterações?")).toBeInTheDocument();
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("fecha direto quando nada foi alterado", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TipoModal {...handlers} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).toHaveBeenCalled();
  });
});
