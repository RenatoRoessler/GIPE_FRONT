import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { fatura } from "../fixtures";

vi.mock("@/lib/api/services/fatura", () => ({ cancelarFatura: vi.fn() }));

import { cancelarFatura } from "@/lib/api/services/fatura";
import { CancelarFaturaDialog } from "./CancelarFaturaDialog";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const onClose = vi.fn();
const onCancelada = vi.fn();

function renderizar(quantidadeSaidas = 14) {
  return renderWithProviders(<CancelarFaturaDialog fatura={fatura({ quantidadeSaidas })} onClose={onClose} onCancelada={onCancelada} />);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CancelarFaturaDialog", () => {
  it("explica o efeito antes de confirmar, sem cancelar ainda", () => {
    renderizar();

    expect(screen.getByRole("dialog", { name: "Cancelar fatura #12?" })).toBeInTheDocument();
    expect(screen.getByText(/As 14 saídas voltam a ficar em aberto e entram na próxima fatura de Auto Peças Sul\./)).toBeInTheDocument();
    expect(screen.getByText(/continua na lista como cancelada/)).toBeInTheDocument();
    expect(screen.getByText(/não pode ser desfeita/)).toBeInTheDocument();
    expect(cancelarFatura).not.toHaveBeenCalled();
  });

  it("com uma só saída, o texto concorda no singular", () => {
    renderizar(1);

    expect(screen.getByText(/A saída volta a ficar em aberto e entra na próxima fatura de Auto Peças Sul\./)).toBeInTheDocument();
  });

  it("confirmar cancela a fatura pelo número e avisa", async () => {
    vi.mocked(cancelarFatura).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Cancelar fatura" }));

    await waitFor(() => expect(onCancelada).toHaveBeenCalledTimes(1));
    expect(cancelarFatura).toHaveBeenCalledWith(12);
  });

  it("Manter fatura fecha sem cancelar", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Manter fatura" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(cancelarFatura).not.toHaveBeenCalled();
  });

  it("enquanto cancela, trava os dois botões", async () => {
    vi.mocked(cancelarFatura).mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Cancelar fatura" }));

    expect(await screen.findByRole("button", { name: "Cancelando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Manter fatura" })).toBeDisabled();
  });

  it("regra recusada pelo back mostra o erro e trava a confirmação", async () => {
    vi.mocked(cancelarFatura).mockRejectedValue(new ApiError("validation", "A fatura já foi paga."));
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Cancelar fatura" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A fatura já foi paga.");
    expect(screen.getByRole("button", { name: "Cancelar fatura" })).toBeDisabled();
    expect(onCancelada).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("erro de rede mostra a mensagem e permite tentar de novo", async () => {
    vi.mocked(cancelarFatura).mockRejectedValueOnce(new ApiError("server", "Falha no servidor.")).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Cancelar fatura" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no servidor.");

    await user.click(screen.getByRole("button", { name: "Cancelar fatura" }));
    await waitFor(() => expect(onCancelada).toHaveBeenCalledTimes(1));
  });
});

describe("CancelarFaturaDialog em telas estreitas", () => {
  it("o botão de perigo é empurrado para baixo de Manter fatura", () => {
    renderizar();

    // O rodapé empilha em ordem inversa; o jsdom não aplica media queries, então confere-se a regra gerada.
    const css = Array.from(document.querySelectorAll("style"))
      .map((estilo) => estilo.textContent)
      .join("");
    expect(css).toContain("@media (max-width: calc(480px - 1px)){");
    expect(css).toContain("{order:-1;}");
  });
});
