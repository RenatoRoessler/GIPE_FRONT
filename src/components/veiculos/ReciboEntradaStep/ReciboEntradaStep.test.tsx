import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { EntradaRegistrada } from "@/types/veiculo";
import { ReciboEntradaStep } from "./ReciboEntradaStep";

vi.mock("@/lib/api/services/empresa", () => ({
  getEmpresa: vi.fn().mockResolvedValue({ company: { nomeFantasia: "Estacionamento Central" } }),
}));

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
  it("não oferece o envio do ticket ao cliente", () => {
    renderWithProviders(<ReciboEntradaStep entrada={entrada} onConcluir={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Enviar ao cliente" })).not.toBeInTheDocument();
  });

  it("mostra na tela o comprovante digital, com QR, placa e entrada", async () => {
    renderWithProviders(<ReciboEntradaStep entrada={entrada} onConcluir={vi.fn()} />);
    const tela = screen.getByRole("region", { name: "Comprovante digital de entrada" });
    expect(within(tela).getByText("Comprovante Digital")).toBeInTheDocument();
    expect(within(tela).getByText("FLP3C88")).toBeInTheDocument();
    expect(within(tela).getByRole("img", { name: "QR Code do ticket 7" })).toBeInTheDocument();
    expect(await within(tela).findByText("Estacionamento Central")).toBeInTheDocument();
  });
});
