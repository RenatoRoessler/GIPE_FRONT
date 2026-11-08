import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("PagarFaturaModal no celular", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("o aviso de que não entra no caixa vem antes das formas de pagamento, uma vez só", () => {
    renderizar();

    const aviso = screen.getByText("Este pagamento não entra no caixa");
    expect(screen.getAllByText("Este pagamento não entra no caixa")).toHaveLength(1);
    const forma = screen.getByRole("group", { name: "Forma de pagamento" });
    expect(aviso.compareDocumentPosition(forma) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("a forma de pagamento aparece como opções tocáveis, não como lista", () => {
    renderizar();

    expect(screen.queryByRole("combobox", { name: "Forma de pagamento" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Pix" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeInTheDocument();
  });

  it("sem forma de pagamento mostra o erro e não envia", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByText("Escolha a forma de pagamento.")).toBeInTheDocument();
    expect(pagarFatura).not.toHaveBeenCalled();
  });

  it("registra com a forma escolhida, sem valor nem data", async () => {
    vi.mocked(pagarFatura).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    await waitFor(() => expect(onPaga).toHaveBeenCalled());
    expect(pagarFatura).toHaveBeenCalledWith(12, { formaPagamento: "2", valorPago: "", dataPagamento: "" }, HOJE);
  });

  it("a data fica recolhida em Data: agora e Alterar mostra o campo", async () => {
    const user = userEvent.setup();
    renderizar();

    expect(screen.getByText("Data: agora")).toBeInTheDocument();
    expect(screen.queryByLabelText("Data do pagamento")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Alterar" }));
    expect((screen.getByLabelText("Data do pagamento") as HTMLInputElement).max).toBe(HOJE);
    expect(screen.queryByText("Data: agora")).not.toBeInTheDocument();
  });

  it("envia a data alterada", async () => {
    vi.mocked(pagarFatura).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("radio", { name: "Dinheiro" }));
    await user.click(screen.getByRole("button", { name: "Alterar" }));
    fireEvent.change(screen.getByLabelText("Data do pagamento"), { target: { value: "2026-11-01" } });
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    await waitFor(() => expect(pagarFatura).toHaveBeenCalledWith(12, { formaPagamento: "1", valorPago: "", dataPagamento: "2026-11-01" }, HOJE));
  });

  it("erro do back rola até a vista e o modal continua aberto", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.mocked(pagarFatura).mockRejectedValue(new ApiError("validation", "A fatura não está aberta."));
    const user = userEvent.setup();
    renderizar();

    await user.click(screen.getByRole("radio", { name: "Pix" }));
    await user.click(screen.getByRole("button", { name: "Registrar pagamento" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A fatura não está aberta.");
    expect(scrollIntoView).toHaveBeenCalled();
    expect(onPaga).not.toHaveBeenCalled();
  });
});
