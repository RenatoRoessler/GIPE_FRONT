import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import { TIPO_PESSOA, type Mensalista, type PagamentoMensalistaResultado, type SituacaoMensalista } from "@/types/mensalista";

vi.mock("@/lib/api/services/mensalista", () => ({
  pagarMensalista: vi.fn(),
  listMensalistas: vi.fn(),
  reenviarContrato: vi.fn(),
}));

import { listMensalistas, pagarMensalista, reenviarContrato } from "@/lib/api/services/mensalista";
import { PagamentoMensalistaModal } from "./PagamentoMensalistaModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const maria: Mensalista = {
  mensalistaId: 1,
  mensalistaTipoId: 3,
  tipoMensal: "Diurno",
  categoria: 99,
  valorMensalidade: 280,
  tipoPessoa: TIPO_PESSOA.Fisica,
  documento: "52998224725",
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  celular: "11912345678",
  diaVencimento: 5,
  ativo: false,
  veiculos: [],
  situacao: "Aguardando Primeiro Pagamento",
  dataProximoVencimento: null,
  diasAteProximoVencimento: null,
};

const resultado: PagamentoMensalistaResultado = {
  paga: { cobrancaId: 1, valor: 280, vencimento: null, dataPagamento: null, formaPagamento: 1, status: 1 },
  proxima: null,
};

const primeiro: SituacaoMensalista = { kind: "aguardando-pagamento", aceitoEm: null };
const handlers = { onClose: vi.fn(), onToast: vi.fn() };

function abrir(situacao: SituacaoMensalista = primeiro, mensalista: Mensalista = maria) {
  return renderWithProviders(<PagamentoMensalistaModal mensalista={mensalista} situacao={situacao} {...handlers} />);
}

const botaoConfirmar = () => screen.getByRole("button", { name: /^Confirmar|^Registrando/ });

beforeEach(() => {
  vi.mocked(pagarMensalista).mockReset();
  vi.mocked(listMensalistas).mockReset();
  vi.mocked(reenviarContrato).mockReset();
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

describe("PagamentoMensalistaModal", () => {
  it("abre com a mensalidade do tipo e Dinheiro marcado, e seleciona o valor ao focar", () => {
    abrir();

    expect(screen.getByRole("dialog", { name: "Registrar pagamento" })).toBeInTheDocument();
    expect(screen.getByText("Maria Souza · Diurno · Todas")).toBeInTheDocument();
    const valor = screen.getByLabelText("Valor pago (R$)");
    expect(valor).toHaveValue("280,00");
    // O foco inicial é do <dialog> nativo (autoFocus), que o jsdom não simula; aqui vale a seleção ao focar.
    valor.focus();
    expect((valor as HTMLInputElement).selectionStart).toBe(0);
    expect((valor as HTMLInputElement).selectionEnd).toBe("280,00".length);
    expect(screen.getByText("Mensalidade do tipo: R$ 280,00")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect(botaoConfirmar()).toHaveTextContent("Confirmar R$ 280,00 em Dinheiro");
  });

  it("não pede empresa, usuário que recebeu nem origem", () => {
    abrir();

    expect(screen.queryByLabelText(/empresa|usuário|origem/i)).not.toBeInTheDocument();
  });

  it("no primeiro pagamento avisa que o cadastro será ativado", () => {
    abrir(primeiro);
    expect(screen.getByText(/o cadastro será ativado/)).toBeInTheDocument();
  });

  it("nos pagamentos seguintes não fala em ativação", () => {
    abrir({ kind: "ativo" }, { ...maria, ativo: true, situacao: "Em Dia" });
    expect(screen.queryByText(/será ativado/)).not.toBeInTheDocument();
  });

  it("o rótulo do botão acompanha o valor e a forma, e avisa quando o valor difere", async () => {
    const user = userEvent.setup();
    abrir();
    expect(screen.queryByText("Diferente da mensalidade do tipo")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Valor pago (R$)"));
    await user.type(screen.getByLabelText("Valor pago (R$)"), "300");
    await user.click(screen.getByRole("radio", { name: "Pix" }));

    expect(botaoConfirmar()).toHaveTextContent("Confirmar R$ 300,00 em Pix");
    expect(screen.getByText("Diferente da mensalidade do tipo")).toBeInTheDocument();
  });

  // O Enter do navegador dispara o submit do formulário; o jsdom não faz o envio implícito com o botão fora dele.
  it("ao submeter o formulário envia o valor e a forma escolhidos", async () => {
    const user = userEvent.setup();
    vi.mocked(pagarMensalista).mockResolvedValue(resultado);
    abrir();

    await user.click(screen.getByRole("radio", { name: "Pix" }));
    fireEvent.submit(screen.getByLabelText("Valor pago (R$)").closest("form")!);

    await waitFor(() =>
      expect(pagarMensalista).toHaveBeenCalledWith({ mensalistaId: 1, valorPago: 280, formaPagamento: 2 }),
    );
  });

  it("valor inválido mostra o erro, foca o campo e não envia", async () => {
    const user = userEvent.setup();
    abrir();

    await user.clear(screen.getByLabelText("Valor pago (R$)"));
    await user.click(botaoConfirmar());

    expect(await screen.findByText("Informe um valor maior que zero, com até 2 casas decimais.")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor pago (R$)")).toHaveFocus();
    expect(botaoConfirmar()).toBeEnabled();
    expect(botaoConfirmar()).toHaveTextContent("Confirmar pagamento");
    expect(pagarMensalista).not.toHaveBeenCalled();
  });

  it("o teclado do campo não deixa digitar sinal nem a terceira casa decimal", async () => {
    const user = userEvent.setup();
    abrir();

    await user.clear(screen.getByLabelText("Valor pago (R$)"));
    await user.type(screen.getByLabelText("Valor pago (R$)"), "-280,555");

    expect(screen.getByLabelText("Valor pago (R$)")).toHaveValue("280,55");
  });

  // "-5" e "280,555" não são mais digitáveis; a validação segue valendo para um valor que chegue por outro caminho.
  it.each(["0", "-5", "280,555"])("recusa o valor %s", async (digitado) => {
    const user = userEvent.setup();
    abrir();

    fireEvent.change(screen.getByLabelText("Valor pago (R$)"), { target: { value: digitado } });
    await user.click(botaoConfirmar());

    expect(await screen.findByText(/Informe um valor maior que zero/)).toBeInTheDocument();
    expect(pagarMensalista).not.toHaveBeenCalled();
  });

  it("enquanto envia, trava os campos e o fechamento", async () => {
    const user = userEvent.setup();
    vi.mocked(pagarMensalista).mockReturnValue(new Promise(() => {}));
    abrir();

    await user.click(botaoConfirmar());

    await waitFor(() => expect(botaoConfirmar()).toHaveTextContent("Registrando pagamento…"));
    expect(botaoConfirmar()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByLabelText("Valor pago (R$)")).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Pix" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(pagarMensalista).toHaveBeenCalledTimes(1);
  });


  it("erro da API aparece em um alerta e o formulário volta editável com o que foi digitado", async () => {
    const user = userEvent.setup();
    vi.mocked(pagarMensalista).mockRejectedValue(new ApiError("validation", "Valor inválido.", 400));
    abrir();

    await user.clear(screen.getByLabelText("Valor pago (R$)"));
    await user.type(screen.getByLabelText("Valor pago (R$)"), "100");
    await user.click(botaoConfirmar());

    expect(await screen.findByRole("alert")).toHaveTextContent("Valor inválido.");
    expect(screen.getByLabelText("Valor pago (R$)")).toBeEnabled();
    expect(screen.getByLabelText("Valor pago (R$)")).toHaveValue("100");
    expect(handlers.onClose).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Valor pago (R$)"), "1");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("Cancelar fecha sem enviar nada", async () => {
    const user = userEvent.setup();
    abrir();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(handlers.onClose).toHaveBeenCalled();
    expect(pagarMensalista).not.toHaveBeenCalled();
  });
});
