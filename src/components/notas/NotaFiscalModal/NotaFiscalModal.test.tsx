import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { NotaSolicitada } from "@/types/notaFiscal";

vi.mock("@/lib/api/services/notaFiscal", () => ({ solicitarNotaFiscal: vi.fn() }));

import { solicitarNotaFiscal } from "@/lib/api/services/notaFiscal";
import { NotaFiscalModal } from "./NotaFiscalModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSolicitada: vi.fn() };

const nota: NotaSolicitada = { notaFiscalId: 9, valor: 15100, dataSolicitacao: "2026-10-23T10:30:00" };

function abrir(props: Partial<React.ComponentProps<typeof NotaFiscalModal>> = {}) {
  return renderWithProviders(<NotaFiscalModal token="ABCD1234EF" valor={15100} placa="HZB-5188" {...handlers} {...props} />);
}

const email = () => screen.getByLabelText("E-mail");
const documento = () => screen.getByLabelText(/^(CPF|CNPJ)$/);
const juridica = () => screen.getByRole("checkbox", { name: /Pessoa jurídica/ });
const solicitar = () => screen.getByRole("button", { name: /Solicitar nota|Enviando/ });

async function preencher(user: ReturnType<typeof userEvent.setup>, valores: { email?: string; documento?: string } = {}) {
  await user.type(email(), valores.email ?? "maria@exemplo.com");
  if (valores.documento) {
    await user.type(documento(), valores.documento);
  }
}

describe("NotaFiscalModal", () => {
  beforeEach(() => {
    vi.mocked(solicitarNotaFiscal).mockReset();
    handlers.onClose.mockReset();
    handlers.onSolicitada.mockReset();
  });

  it("mostra o valor do recibo, a placa e só os campos de e-mail, tipo de pessoa e CPF", () => {
    abrir();

    expect(screen.getByText("Valor da nota")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s15\.100,00/)).toBeInTheDocument();
    expect(screen.getByText("Saída de HZB-5188")).toBeInTheDocument();
    expect(email()).toBeInTheDocument();
    expect(juridica()).not.toBeChecked();
    expect(screen.getByLabelText("CPF")).toBeInTheDocument();
    expect(screen.queryByLabelText("CNPJ")).not.toBeInTheDocument();
    // O valor não é um campo: não dá para alterá-lo.
    expect(screen.queryByLabelText(/valor/i)).not.toBeInTheDocument();
  });

  it("sem placa, a referência é só o valor do recibo", () => {
    abrir({ placa: null });
    expect(screen.getByText("Valor do recibo")).toBeInTheDocument();
  });

  it("o botão só habilita com e-mail preenchido", async () => {
    const user = userEvent.setup();
    abrir();

    expect(solicitar()).toBeDisabled();
    await user.type(email(), "m");
    expect(solicitar()).toBeEnabled();
  });

  it("e-mail inválido mostra o erro no campo e não envia nada", async () => {
    const user = userEvent.setup();
    abrir();

    await preencher(user, { email: "maria@" });
    await user.click(solicitar());

    expect(await screen.findByText("Informe um e-mail válido")).toBeInTheDocument();
    expect(email()).toHaveAttribute("aria-invalid", "true");
    expect(solicitarNotaFiscal).not.toHaveBeenCalled();
  });

  it("CPF inválido mostra o erro e não envia", async () => {
    const user = userEvent.setup();
    abrir();

    await preencher(user, { documento: "11111111111" });
    await user.click(solicitar());

    expect(await screen.findByText("CPF inválido")).toBeInTheDocument();
    expect(solicitarNotaFiscal).not.toHaveBeenCalled();
  });

  it("pessoa física: o CPF é opcional e tem a máscara de CPF", async () => {
    const user = userEvent.setup();
    abrir();

    expect(screen.getByText("Opcional. Informe para constar na nota.")).toBeInTheDocument();
    await user.type(documento(), "52998224725");
    expect(documento()).toHaveValue("529.982.247-25");
  });

  it("marcar pessoa jurídica troca o campo para CNPJ obrigatório, com a máscara de CNPJ", async () => {
    const user = userEvent.setup();
    abrir();

    await user.click(juridica());

    expect(juridica()).toBeChecked();
    expect(screen.getByLabelText("CNPJ")).toBeInTheDocument();
    expect(screen.queryByLabelText("CPF")).not.toBeInTheDocument();
    expect(screen.getByText("Obrigatório para pessoa jurídica.")).toBeInTheDocument();
    expect(screen.queryByText("Opcional. Informe para constar na nota.")).not.toBeInTheDocument();

    await user.type(documento(), "11222333000181");
    expect(documento()).toHaveValue("11.222.333/0001-81");
  });

  it("pessoa jurídica sem CNPJ mostra o erro e não envia", async () => {
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(juridica());
    await user.click(solicitar());

    expect(await screen.findByText("Informe o CNPJ")).toBeInTheDocument();
    expect(documento()).toHaveAttribute("aria-invalid", "true");
    expect(solicitarNotaFiscal).not.toHaveBeenCalled();
  });

  it("pessoa jurídica com CNPJ inválido mostra o erro e não envia", async () => {
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(juridica());
    await user.type(documento(), "11222333000182");
    await user.click(solicitar());

    expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
    expect(solicitarNotaFiscal).not.toHaveBeenCalled();
  });

  it("pessoa jurídica com CNPJ válido envia a solicitação", async () => {
    vi.mocked(solicitarNotaFiscal).mockResolvedValue(nota);
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(juridica());
    await user.type(documento(), "11222333000181");
    await user.click(solicitar());

    await screen.findByRole("heading", { name: "Nota fiscal solicitada" });
    expect(solicitarNotaFiscal).toHaveBeenCalledWith({ token: "ABCD1234EF", valor: 15100, email: "maria@exemplo.com", documento: "11.222.333/0001-81" });
  });

  it("trocar o tipo de pessoa limpa o documento e o erro que ele tinha", async () => {
    const user = userEvent.setup();
    abrir();

    await user.type(documento(), "11111111111");
    await user.click(juridica());
    expect(documento()).toHaveValue("");
    expect(screen.queryByText("CPF inválido")).not.toBeInTheDocument();

    await user.type(documento(), "11222333000181");
    await user.click(juridica());
    expect(screen.getByLabelText("CPF")).toHaveValue("");
    expect(juridica()).not.toBeChecked();
  });

  it("o botão só habilita com e-mail, mesmo com pessoa jurídica marcada", async () => {
    const user = userEvent.setup();
    abrir();

    await user.click(juridica());
    expect(solicitar()).toBeDisabled();
  });

  it("mostra o contador de caracteres do e-mail só perto do limite", async () => {
    const user = userEvent.setup();
    abrir();

    await user.type(email(), "a".repeat(10));
    expect(screen.queryByText(/\/150 caracteres/)).not.toBeInTheDocument();

    // Com e-mail inválido o erro ocupa o lugar da dica; o contador aparece com um e-mail completo e longo.
    await user.clear(email());
    await user.type(email(), `${"a".repeat(120)}@x.com`);
    expect(screen.getByText("126/150 caracteres")).toBeInTheDocument();
  });

  it("solicita sem documento (campo vazio), mostra a confirmação e avisa quem abriu", async () => {
    vi.mocked(solicitarNotaFiscal).mockResolvedValue(nota);
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(solicitar());

    expect(await screen.findByRole("heading", { name: "Nota fiscal solicitada" })).toBeInTheDocument();
    expect(solicitarNotaFiscal).toHaveBeenCalledWith({ token: "ABCD1234EF", valor: 15100, email: "maria@exemplo.com", documento: "" });
    expect(handlers.onSolicitada).toHaveBeenCalledWith(nota);
    expect(screen.getByText("A empresa vai lançar a nota com os dados informados.")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s15\.100,00/)).toBeInTheDocument();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
  });

  it("a confirmação recebe o foco e Concluir fecha o modal", async () => {
    vi.mocked(solicitarNotaFiscal).mockResolvedValue(nota);
    const user = userEvent.setup();
    abrir();

    await preencher(user, { documento: "52998224725" });
    await user.click(solicitar());

    const titulo = await screen.findByRole("heading", { name: "Nota fiscal solicitada" });
    await waitFor(() => expect(titulo).toHaveFocus());
    expect(vi.mocked(solicitarNotaFiscal).mock.calls[0][0].documento).toBe("529.982.247-25");

    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("Enter no formulário envia a solicitação", async () => {
    vi.mocked(solicitarNotaFiscal).mockResolvedValue(nota);
    const user = userEvent.setup();
    abrir();

    await user.type(email(), "maria@exemplo.com{Enter}");
    await waitFor(() => expect(solicitarNotaFiscal).toHaveBeenCalledTimes(1));
  });

  it("nota já solicitada mostra o aviso, vira Fechar e não avisa quem abriu", async () => {
    vi.mocked(solicitarNotaFiscal).mockRejectedValue(new ApiError("validation", "Já foi solicitada uma nota para este recibo.", 400));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(solicitar());

    expect(await screen.findByRole("alert")).toHaveTextContent("A nota fiscal deste recibo já foi solicitada.");
    expect(screen.queryByRole("button", { name: "Solicitar nota" })).not.toBeInTheDocument();
    expect(handlers.onSolicitada).not.toHaveBeenCalled();

    // O cabeçalho do modal também tem um "Fechar" (o X); o do rodapé vem por último.
    await user.click(screen.getAllByRole("button", { name: "Fechar" }).at(-1) as HTMLElement);
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("limite de tentativas mostra a orientação e preserva o formulário", async () => {
    vi.mocked(solicitarNotaFiscal).mockRejectedValue(new ApiError("rate_limited", undefined, 429));
    const user = userEvent.setup();
    abrir();

    await preencher(user, { documento: "52998224725" });
    await user.click(solicitar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Muitas tentativas. Aguarde um minuto e tente de novo.");
    expect(email()).toHaveValue("maria@exemplo.com");
    expect(documento()).toHaveValue("529.982.247-25");
    expect(solicitar()).toBeEnabled();
  });

  it("recibo não encontrado e falha de rede mostram o motivo e deixam tentar de novo", async () => {
    vi.mocked(solicitarNotaFiscal).mockRejectedValueOnce(new ApiError("validation", "Recibo não encontrado ou não pago.", 400));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(solicitar());
    expect(await screen.findByRole("alert")).toHaveTextContent("Recibo não encontrado ou não pago.");

    vi.mocked(solicitarNotaFiscal).mockRejectedValueOnce(new ApiError("network"));
    await user.click(solicitar());
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível conectar ao servidor."));
    expect(email()).toHaveValue("maria@exemplo.com");
  });

  it("digitar de novo limpa o erro anterior", async () => {
    vi.mocked(solicitarNotaFiscal).mockRejectedValue(new ApiError("server"));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(solicitar());
    await screen.findByRole("alert");

    await user.type(email(), "x");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("durante o envio, campos e botões ficam desabilitados e o modal não fecha", async () => {
    vi.mocked(solicitarNotaFiscal).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    abrir();

    await preencher(user);
    await user.click(solicitar());

    expect(await screen.findByRole("button", { name: "Enviando…" })).toBeDisabled();
    expect(email()).toBeDisabled();
    expect(documento()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("fechar sem dados digitados fecha direto", async () => {
    const user = userEvent.setup();
    abrir();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Descartar a solicitação?")).not.toBeInTheDocument();
  });

  it("fechar com dados digitados pede confirmação; Continuar editando mantém, Descartar fecha", async () => {
    const user = userEvent.setup();
    abrir();

    await user.type(email(), "maria@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Descartar a solicitação?")).toBeInTheDocument();
    expect(handlers.onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(screen.queryByText("Descartar a solicitação?")).not.toBeInTheDocument();
    expect(email()).toHaveValue("maria@exemplo.com");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(await screen.findByRole("button", { name: "Descartar" }));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});
