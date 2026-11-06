import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { EntradaRegistrada } from "@/types/veiculo";
import { ReciboEntradaStep } from "./ReciboEntradaStep";

vi.mock("@/lib/api/services/empresa", () => ({
  getEmpresa: vi.fn().mockResolvedValue({ company: { nomeFantasia: "Estacionamento Central" } }),
}));

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

const entrada: EntradaRegistrada = {
  patioId: 1,
  placa: "FLP3C88",
  categoria: 2,
  codigoTicket: 10,
  sequencial: 7,
  mensalista: false,
  modelo: "COROLLA",
  cor: "BRANCO",
  dataHoraEntrada: "2026-10-17T10:06:06",
  rotatividadeId: null,
  rotatividadeDescricao: null,
  usuarioIdEntrada: 1,
  usuarioEntrada: "Maria",
  token: "tok123",
};

describe("ReciboEntradaStep", () => {
  it("mostra 'Enviar ao cliente' e abre o popup com a placa", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReciboEntradaStep entrada={entrada} onConcluir={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Enviar ao cliente" }));
    expect(await screen.findByRole("dialog", { name: "Enviar ticket ao cliente" })).toBeInTheDocument();
    expect(screen.getByLabelText("WhatsApp do cliente")).toBeInTheDocument();
  });

  it("avisa que a mensagem foi aberta depois de enviar", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "open").mockReturnValue(null);
    renderWithProviders(<ReciboEntradaStep entrada={entrada} onConcluir={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Enviar ao cliente" }));
    await user.type(await screen.findByLabelText("WhatsApp do cliente"), "11912345678");
    await user.click(screen.getByRole("button", { name: "Abrir WhatsApp" }));
    expect(await screen.findByText("Mensagem aberta no WhatsApp. Confirme o envio por lá.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Enviar ticket ao cliente" })).not.toBeInTheDocument();
  });

  it("não mostra o botão quando a entrada não tem token", () => {
    renderWithProviders(<ReciboEntradaStep entrada={{ ...entrada, token: "" }} onConcluir={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Enviar ao cliente" })).not.toBeInTheDocument();
  });
});
