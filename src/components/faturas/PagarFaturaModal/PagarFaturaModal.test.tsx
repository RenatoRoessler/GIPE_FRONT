import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { formatDataInput } from "@/lib/periodo";
import { renderWithProviders } from "@/test/render";
import { fatura } from "../fixtures";

vi.mock("@/lib/api/services/fatura", () => ({ pagarFatura: vi.fn() }));

import { pagarFatura } from "@/lib/api/services/fatura";
import { PagarFaturaModal } from "./PagarFaturaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const HOJE = formatDataInput(new Date());
const onClose = vi.fn();
const onPaga = vi.fn();

function renderizar() {
  return renderWithProviders(<PagarFaturaModal fatura={fatura({ valorTotal: 1250 })} onClose={onClose} onPaga={onPaga} />);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("PagarFaturaModal", () => {
  it("abre com o valor da fatura, as ajudas e o aviso de que não entra no caixa", () => {
    renderizar();

    expect(screen.getByRole("dialog", { name: "Registrar pagamento · Fatura #12" })).toBeInTheDocument();
    expect(screen.getByText("Valor da fatura")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.250,00", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Em branco: o valor total da fatura.")).toBeInTheDocument();
    expect(screen.getByText("Em branco: agora.")).toBeInTheDocument();
    expect(screen.getByText("Este pagamento não entra no caixa")).toBeInTheDocument();
    expect((screen.getByLabelText("Data do pagamento") as HTMLInputElement).max).toBe(HOJE);
  });

  it("sem forma de pagamento mostra o erro e não envia", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByText("Escolha a forma de pagamento.")).toBeInTheDocument();
    expect(pagarFatura).not.toHaveBeenCalled();
  });

  it("recusa valor pago zero", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Pix");
    await user.type(screen.getByLabelText("Valor pago (R$)"), "0");
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByText("O valor pago precisa ser maior que zero.")).toBeInTheDocument();
    expect(pagarFatura).not.toHaveBeenCalled();
  });

  it("recusa data de pagamento futura", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Pix");
    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2099-01-01" } });
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByText("A data não pode ser depois de hoje.")).toBeInTheDocument();
    expect(pagarFatura).not.toHaveBeenCalled();
  });

  it("valor pago diferente do total mostra um aviso que não bloqueia", async () => {
    vi.mocked(pagarFatura).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    expect(screen.queryByText("Diferente do valor da fatura")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Pix");
    await user.type(screen.getByLabelText("Valor pago (R$)"), "1200");

    expect(screen.getByText("Diferente do valor da fatura")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));
    await waitFor(() => expect(pagarFatura).toHaveBeenCalledTimes(1));
  });

  it("valor pago igual ao total não mostra o aviso", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText("Valor pago (R$)"), "1250");

    expect(screen.queryByText("Diferente do valor da fatura")).not.toBeInTheDocument();
  });

  it("registra só com a forma de pagamento: sem valor nem data no envio", async () => {
    vi.mocked(pagarFatura).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Pix");
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    await waitFor(() => expect(onPaga).toHaveBeenCalledTimes(1));
    expect(pagarFatura).toHaveBeenCalledWith(12, { formaPagamento: "2", valorPago: "", dataPagamento: "" }, HOJE);
  });

  it("envia o valor e a data informados", async () => {
    vi.mocked(pagarFatura).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderizar();

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Dinheiro");
    await user.type(screen.getByLabelText("Valor pago (R$)"), "1000,50");
    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2026-11-01" } });
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    await waitFor(() => expect(pagarFatura).toHaveBeenCalledTimes(1));
    expect(pagarFatura).toHaveBeenCalledWith(12, { formaPagamento: "1", valorPago: "R$ 1.000,50", dataPagamento: "2026-11-01" }, HOJE);
  });

  it("erro do back fica no topo e o modal continua aberto com os dados", async () => {
    vi.mocked(pagarFatura).mockRejectedValue(new ApiError("validation", "A fatura não está aberta."));
    const user = userEvent.setup();
    renderizar();

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Pix");
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A fatura não está aberta.");
    expect(onPaga).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Forma de pagamento")).toHaveValue("2");
  });

  it("enquanto envia, trava os campos e mostra Registrando", async () => {
    vi.mocked(pagarFatura).mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    renderizar();

    await user.selectOptions(screen.getByLabelText("Forma de pagamento"), "Pix");
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByRole("button", { name: "Registrando…" })).toBeDisabled();
    expect(screen.getByLabelText("Forma de pagamento")).toBeDisabled();
  });

  it("Cancelar fecha sem registrar", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pagarFatura).not.toHaveBeenCalled();
  });
});
