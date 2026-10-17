import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { EntradaRegistrada } from "@/types/veiculo";

vi.mock("@/lib/api/services/patio", () => ({ registrarEntrada: vi.fn() }));
vi.mock("@/lib/api/services/veiculo", () => ({ consultarPlaca: vi.fn(), listModelos: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockRejectedValue(new Error("sem empresa")) }));

import { registrarEntrada } from "@/lib/api/services/patio";
import { consultarPlaca } from "@/lib/api/services/veiculo";
import { EntradaVeiculoModal } from "./EntradaVeiculoModal";

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

const registrada: EntradaRegistrada = {
  patioId: 10,
  placa: "ABC1D23",
  categoria: 2,
  codigoTicket: 1,
  sequencial: 7,
  mensalista: false,
  modelo: "ONIX",
  cor: "AZUL",
  dataHoraEntrada: "2026-10-17T10:06:06.2094",
  rotatividadeId: 1,
  rotatividadeDescricao: "Tabela padrão",
  usuarioIdEntrada: 1,
  usuarioEntrada: "Operador",
  token: "227SUSYV",
};

function renderModal() {
  return renderWithProviders(<EntradaVeiculoModal {...handlers} />);
}

describe("EntradaVeiculoModal", () => {
  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset();
    vi.mocked(consultarPlaca).mockReset();
    handlers.onClose.mockReset();
    handlers.onSuccess.mockReset();
  });

  it("começa com a cor Prata e o registro bloqueado", () => {
    renderModal();
    expect(screen.getByRole("radio", { name: "Prata" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
  });

  it("libera o registro com placa válida e categoria", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeEnabled();
  });

  it("envia a cor escolhida do enum e mostra o cupom com o link do token", async () => {
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Azul" }));
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ placa: "ABC1D23", categoria: 2, cor: "AZUL" });
    expect(await screen.findByText("Entrada registrada")).toBeInTheDocument();
  });

  it("aplica a cor do cadastro só quando ela existe na lista", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "Vermelho",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("radio", { name: "Vermelho" })).toBeChecked());
  });

  it("mantém a seleção quando a cor do cadastro não é da lista", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "cinza claro",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Dados do cadastro preenchidos.");
    expect(screen.getByRole("radio", { name: "Prata" })).toBeChecked();
  });
});
