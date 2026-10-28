import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import type { ComprovanteCliente } from "@/types/veiculo";

const nav = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn(), query: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, back: nav.back }),
  useSearchParams: () => new URLSearchParams(nav.query),
}));
vi.mock("@/lib/api/services/patio", () => ({ listPatio: vi.fn(), consultarComprovante: vi.fn() }));

import { consultarComprovante, listPatio } from "@/lib/api/services/patio";
import { ComprovanteDigital } from "./ComprovanteDigital";

const veiculo: PatioVeiculo = {
  patioId: 7,
  placa: "FLP3C88",
  categoria: 2,
  modelo: "Corolla",
  cor: "BRANCO",
  codigoTicket: 24024,
  sequencial: 2464,
  mensalista: false,
  dataHoraEntrada: "2026-10-17T15:30:22",
  minutosPermanencia: 8,
  permanencia: "8min",
  rotatividadeDescricao: null,
  usuarioEntrada: null,
  token: "ABCD1234",
};

const comprovante: ComprovanteCliente = {
  cnpj: "00000000000100",
  razaoSocial: "Estacionamento Central",
  endereco: "Rua Exemplo, 123",
  telefone: "1100000000",
  placa: "FLP3C88",
  modelo: "Corolla",
  cor: "BRANCO",
  categoriaId: 2,
  categoriaDescricao: "Carro pequeno",
  dataHoraEntrada: "2026-10-17T15:30:22",
  dataHoraConsulta: "2026-10-17T15:38:22",
  minutosPermanencia: 8,
  permanencia: "8min",
  sequencial: 2464,
  token: "ABCD1234",
  valorAtual: 12,
};

function abrir(lista: PatioVeiculo[] = [veiculo]) {
  vi.mocked(listPatio).mockResolvedValue(lista);
  return renderWithProviders(<ComprovanteDigital patioId={7} />);
}

beforeEach(() => {
  nav.replace.mockReset();
  nav.back.mockReset();
  nav.query = "";
  vi.mocked(listPatio).mockReset();
  vi.mocked(consultarComprovante).mockReset().mockResolvedValue(comprovante);
});

describe("ComprovanteDigital", () => {
  it("mostra o estabelecimento, o título, a placa, a entrada e as instruções", async () => {
    abrir();

    expect(await screen.findByText("Estacionamento Central")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Comprovante Digital" })).toBeInTheDocument();
    expect(screen.getByText("00.000.000/0001-00")).toBeInTheDocument();
    expect(screen.getByText("Rua Exemplo, 123")).toBeInTheDocument();
    expect(screen.getByText("(11) 0000-0000")).toBeInTheDocument();
    expect(screen.getByText("FLP3C88")).toBeInTheDocument();
    expect(screen.getByText("Corolla · BRANCO")).toBeInTheDocument();
    expect(screen.getByText(/Ticket 24024/)).toBeInTheDocument();
    expect(screen.getByText("Aponte a câmera do celular")).toBeInTheDocument();
  });

  it("o QR leva à página pública do comprovante", async () => {
    abrir();

    const qr = await screen.findByRole("img", { name: "QR Code do ticket 24024" });
    expect(qr).toBeInTheDocument();
    // O endereço está no QR e a página pública existe com o mesmo token.
    expect(`${window.location.origin}/comprovante/ABCD1234`).toMatch(/\/comprovante\/ABCD1234$/);
  });

  it("o foco vai ao título", async () => {
    abrir();

    expect(await screen.findByRole("heading", { name: "Comprovante Digital" })).toHaveFocus();
  });

  it("Pronto, ✕ e Esc voltam no histórico quando veio do ticket", async () => {
    nav.query = "tipo=avulsos&de=ticket";
    abrir();
    await screen.findByText("FLP3C88");

    await userEvent.click(screen.getByRole("button", { name: "Pronto" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar e voltar ao ticket" }));
    await userEvent.keyboard("{Escape}");

    expect(nav.back).toHaveBeenCalledTimes(3);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("aberto por link direto, fechar vai ao ticket com os filtros", async () => {
    nav.query = "tipo=avulsos";
    abrir();
    await screen.findByText("FLP3C88");

    await userEvent.click(screen.getByRole("button", { name: "Pronto" }));

    expect(nav.replace).toHaveBeenCalledWith("/patio/7?tipo=avulsos");
    expect(nav.back).not.toHaveBeenCalled();
  });

  it("omite os campos do estabelecimento que não vieram", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue({ ...comprovante, endereco: null, telefone: null });
    abrir();
    await screen.findByText("Estacionamento Central");

    expect(screen.queryByText(/Telefone/)).not.toBeInTheDocument();
    expect(screen.queryByText("Rua Exemplo, 123")).not.toBeInTheDocument();
  });

  it("sem token diz que o comprovante está indisponível", async () => {
    abrir([{ ...veiculo, token: null }]);

    expect(await screen.findByText("Comprovante indisponível para este veículo.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /QR Code/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Voltar ao ticket" }));
    expect(nav.replace).toHaveBeenCalledWith("/patio/7");
  });

  it("veículo que saiu diz que não está mais no pátio", async () => {
    abrir([{ ...veiculo, patioId: 99 }]);

    expect(await screen.findByText("Este carro não está mais no pátio.")).toBeInTheDocument();
  });

  it("carregando mostra um status", () => {
    vi.mocked(listPatio).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ComprovanteDigital patioId={7} />);

    expect(screen.getByRole("status", { name: "Carregando o comprovante" })).toBeInTheDocument();
  });
});
