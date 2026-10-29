import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { Carimbo } from "@/types/carimbo";

// O leitor real abre a câmera; aqui um botão faz o papel de um QR lido.
vi.mock("@/components/veiculos/LeitorQrSaida", () => ({
  LeitorQrSaida: ({ onToken, buscando }: { onToken: (token: string) => void; buscando?: boolean }) => (
    <div>
      <button type="button" onClick={() => onToken("58BMTFRW")}>
        Ler QR
      </button>
      <button type="button" onClick={() => onToken("OUTROTKN")}>
        Ler outro QR
      </button>
      {buscando && <span>Buscando veículo…</span>}
    </div>
  ),
}));
vi.mock("@/lib/api/services/carimbo", () => ({ carimbarTicket: vi.fn() }));

import { carimbarTicket } from "@/lib/api/services/carimbo";
import { CarimboPage } from "./CarimboPage";

const carimbar = vi.mocked(carimbarTicket);

const CARIMBO: Carimbo = {
  estacionamento: "teste 2",
  placa: "TEP6I32",
  modelo: "Fusca",
  cor: "PRATA",
  categoria: 2,
  dataHoraEntrada: "2026-10-29T18:15:32.60593",
  rotatividadeId: 17,
  rotatividade: "convenio mercado 1",
  dataHoraConveniada: "2026-10-29T18:15:51.1460216",
};

beforeEach(() => {
  carimbar.mockReset();
});

describe("CarimboPage", () => {
  it("abre com o leitor e a orientação", () => {
    renderWithProviders(<CarimboPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Carimbar ticket" })).toBeInTheDocument();
    expect(screen.getByText(/Aponte a câmera para o QR Code/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ler QR" })).toBeInTheDocument();
  });

  it("carimba o ticket lido e mostra o resultado no lugar do leitor", async () => {
    carimbar.mockResolvedValue(CARIMBO);
    const user = userEvent.setup();
    renderWithProviders(<CarimboPage />);

    await user.click(screen.getByRole("button", { name: "Ler QR" }));

    expect(await screen.findByRole("heading", { name: "Ticket carimbado" })).toBeInTheDocument();
    expect(carimbar).toHaveBeenCalledWith("58BMTFRW");
    expect(screen.getByText("convenio mercado 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ler QR" })).not.toBeInTheDocument();
  });

  it("Carimbar outro ticket volta ao leitor", async () => {
    carimbar.mockResolvedValue(CARIMBO);
    const user = userEvent.setup();
    renderWithProviders(<CarimboPage />);
    await user.click(screen.getByRole("button", { name: "Ler QR" }));
    await user.click(await screen.findByRole("button", { name: "Carimbar outro ticket" }));

    expect(screen.getByRole("button", { name: "Ler QR" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ticket carimbado" })).not.toBeInTheDocument();
  });

  it("indica a busca em andamento e ignora novas leituras até terminar", async () => {
    let concluir: (carimbo: Carimbo) => void = () => undefined;
    carimbar.mockReturnValue(new Promise<Carimbo>((resolve) => (concluir = resolve)));
    const user = userEvent.setup();
    renderWithProviders(<CarimboPage />);

    await user.click(screen.getByRole("button", { name: "Ler QR" }));
    expect(await screen.findByText("Buscando veículo…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ler QR" }));
    await user.click(screen.getByRole("button", { name: "Ler outro QR" }));

    expect(carimbar).toHaveBeenCalledTimes(1);
    concluir(CARIMBO);
    expect(await screen.findByRole("heading", { name: "Ticket carimbado" })).toBeInTheDocument();
  });

  it("erro de negócio mostra a mensagem do back e mantém o leitor", async () => {
    carimbar.mockRejectedValue(new ApiError("validation", "Este veículo já foi carimbado.", 400));
    const user = userEvent.setup();
    renderWithProviders(<CarimboPage />);

    await user.click(screen.getByRole("button", { name: "Ler QR" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Este veículo já foi carimbado.");
    expect(screen.getByRole("button", { name: "Ler QR" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();

    // O mesmo QR ainda diante da câmera não repete a chamada; outro ticket é aceito.
    await user.click(screen.getByRole("button", { name: "Ler QR" }));
    expect(carimbar).toHaveBeenCalledTimes(1);
    carimbar.mockResolvedValue(CARIMBO);
    await user.click(screen.getByRole("button", { name: "Ler outro QR" }));
    expect(await screen.findByRole("heading", { name: "Ticket carimbado" })).toBeInTheDocument();
  });

  it("sem permissão (403) mostra só o aviso, sem leitor nem nova tentativa", async () => {
    carimbar.mockRejectedValue(new ApiError("forbidden", undefined, 403));
    const user = userEvent.setup();
    renderWithProviders(<CarimboPage />);

    await user.click(screen.getByRole("button", { name: "Ler QR" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para carimbar tickets.");
    expect(screen.queryByRole("button", { name: "Ler QR" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("falha de conexão oferece reenviar o mesmo token sem nova leitura", async () => {
    carimbar.mockRejectedValueOnce(new ApiError("network")).mockResolvedValue(CARIMBO);
    const user = userEvent.setup();
    renderWithProviders(<CarimboPage />);

    await user.click(screen.getByRole("button", { name: "Ler QR" }));
    await user.click(await screen.findByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(carimbar).toHaveBeenCalledTimes(2));
    expect(carimbar).toHaveBeenNthCalledWith(2, "58BMTFRW");
    expect(await screen.findByRole("heading", { name: "Ticket carimbado" })).toBeInTheDocument();
  });
});
