import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { conferenciaAberta } from "@/lib/api/services/conferenciaPatio.fixture";
import { fromConferenciaResponse } from "@/lib/api/services/conferenciaPatio.mapper";
import { renderWithProviders } from "@/test/render";
import type { SaidaRegistrada } from "@/types/saida";

vi.mock("@/lib/api/services/conferenciaPatio", () => ({ darSaidaPeloItem: vi.fn() }));

import { darSaidaPeloItem } from "@/lib/api/services/conferenciaPatio";
import { DarSaidaConferenciaModal, MENSAGEM_SAIDA_REGISTRADA } from "./DarSaidaConferenciaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const item = fromConferenciaResponse(conferenciaAberta).itens[2];

const registrada: SaidaRegistrada = {
  patioId: item.patioId,
  placa: item.placa,
  dataHoraEntrada: "2026-10-17T10:33:13",
  dataHoraSaida: "2026-11-04T12:00:00",
  minutosPermanencia: 100,
  valor: 0,
  formaPagamento: 1,
  tokenRecibo: "ABCD1234",
};

const onClose = vi.fn();
const onConcluida = vi.fn();

function montar() {
  const utilitarios = renderWithProviders(<DarSaidaConferenciaModal conferenciaId={1} item={item} onClose={onClose} onConcluida={onConcluida} />);
  return { user: userEvent.setup(), ...utilitarios };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(darSaidaPeloItem).mockResolvedValue(registrada);
});

describe("DarSaidaConferenciaModal", () => {
  it("pede só o motivo: sem valor, pagamento nem recibo", () => {
    montar();
    expect(screen.getByRole("dialog", { name: "Dar saída" })).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar saída" })).toBeDisabled();
  });

  it("o motivo 'Outro' pede a descrição, com contador, e só então libera a confirmação", async () => {
    const { user } = montar();
    await user.selectOptions(screen.getByLabelText("Motivo"), "Outro");

    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(screen.getByText("0/300")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar saída" })).toBeDisabled();

    await user.type(screen.getByLabelText("Descrição"), "Saiu na troca de turno");
    expect(screen.getByText("22/300")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar saída" })).toBeEnabled();
  });

  it("confirma com o motivo, fecha e avisa", async () => {
    const { user } = montar();
    await user.selectOptions(screen.getByLabelText("Motivo"), "Saiu sem baixa");
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    await vi.waitFor(() => expect(onConcluida).toHaveBeenCalledWith(MENSAGEM_SAIDA_REGISTRADA));
    expect(darSaidaPeloItem).toHaveBeenCalledWith(1, item.patioConferenciaItemId, { valor: 0, formaPagamento: 1, motivo: 1 });
    expect(onClose).toHaveBeenCalled();
  });

  it("envia a descrição no motivo 'Outro'", async () => {
    const { user } = montar();
    await user.selectOptions(screen.getByLabelText("Motivo"), "Outro");
    await user.type(screen.getByLabelText("Descrição"), "Troca de turno");
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    await vi.waitFor(() => expect(darSaidaPeloItem).toHaveBeenCalled());
    expect(vi.mocked(darSaidaPeloItem).mock.calls[0][2]).toEqual({ valor: 0, formaPagamento: 1, motivo: 4, descricao: "Troca de turno" });
  });

  it("erro do servidor: mostra, mantém a folha e o botão disponível para tentar de novo", async () => {
    vi.mocked(darSaidaPeloItem).mockRejectedValue(new ApiError("validation", "Abra o caixa para dar saída.", 400));
    const { user } = montar();
    await user.selectOptions(screen.getByLabelText("Motivo"), "Saiu sem baixa");
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(await screen.findByText("Abra o caixa para dar saída.")).toBeInTheDocument();
    expect(onConcluida).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar saída" })).toBeEnabled();
  });

  it("'Cancelar' fecha sem registrar", async () => {
    const { user } = montar();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(darSaidaPeloItem).not.toHaveBeenCalled();
  });
});
