import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { renderWithProviders } from "@/test/render";
import type { EntradaRegistrada } from "@/types/veiculo";

vi.mock("@/lib/api/services/patio", () => ({ registrarEntrada: vi.fn() }));
vi.mock("@/lib/api/services/veiculo", () => ({ consultarPlaca: vi.fn(), listModelos: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/api/services/empresa", () => ({ getEmpresa: vi.fn().mockRejectedValue(new Error("sem empresa")) }));

// O leitor em si é testado à parte: aqui ele só devolve uma placa lida.
vi.mock("../LeitorPlacaModal", () => ({
  LeitorPlacaModal: ({ open, onConfirm, onDigitar }: { open: boolean; onConfirm: (placa: string) => void; onDigitar: () => void }) =>
    open ? (
      <div role="dialog" aria-label="Leitor de placa">
        <button type="button" onClick={() => onConfirm("ABC1D23")}>
          confirmar leitura
        </button>
        <button type="button" onClick={onDigitar}>
          digitar leitura
        </button>
      </div>
    ) : null,
}));

import { registrarEntrada } from "@/lib/api/services/patio";
import { consultarPlaca } from "@/lib/api/services/veiculo";
import { EntradaVeiculoModal } from "./EntradaVeiculoModal";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

const handlers = { onClose: vi.fn(), onSuccess: vi.fn() };

const registrada: EntradaRegistrada = {
  patioId: 10,
  placa: "ABC1D23",
  categoria: 2,
  codigoTicket: 1,
  sequencial: 7,
  mensalista: false,
  modelo: "ONIX",
  cor: "AZUL",
  dataHoraEntrada: "2026-10-17T10:06:06.2094",
  rotatividadeId: 1,
  rotatividadeDescricao: "Tabela padrão",
  usuarioIdEntrada: 1,
  usuarioEntrada: "Operador",
  token: "227SUSYV",
};

function renderModal() {
  return renderWithProviders(<EntradaVeiculoModal {...handlers} />);
}

describe("EntradaVeiculoModal", () => {
  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset();
    vi.mocked(consultarPlaca).mockReset();
    handlers.onClose.mockReset();
    handlers.onSuccess.mockReset();
  });

  it("começa com a cor Prata e o registro bloqueado", () => {
    renderModal();
    expect(screen.getByRole("radio", { name: "Prata" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
  });

  it("libera o registro com placa válida e categoria", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    expect(screen.getByRole("button", { name: "Registrar entrada" })).toBeEnabled();
  });

  it("envia a cor escolhida do enum e mostra o cupom com o link do token", async () => {
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Azul" }));
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ placa: "ABC1D23", categoria: 2, cor: "AZUL" });
    expect(await screen.findByText("Entrada registrada")).toBeInTheDocument();
  });

  it("aplica a cor do cadastro só quando ela existe na lista", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "Vermelho",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await waitFor(() => expect(screen.getByRole("radio", { name: "Vermelho" })).toBeChecked());
  });

  it("mantém a seleção quando a cor do cadastro não é da lista", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "cinza claro",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Dados do cadastro preenchidos.");
    expect(screen.getByRole("radio", { name: "Prata" })).toBeChecked();
  });

  it("preenche a placa e consulta o cadastro ao confirmar a leitura da câmera", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({
      placa: "ABC1D23",
      encontrado: true,
      origem: "x",
      modelo: "ONIX",
      cor: "Vermelho",
      categoria: 2,
    });
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Ler placa pela câmera" }));
    await user.click(screen.getByRole("button", { name: "confirmar leitura" }));

    expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Vermelho" })).toBeChecked());
    expect(consultarPlaca).toHaveBeenCalledWith("ABC1D23", expect.any(AbortSignal));
    expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument();
    expect(registrarEntrada).not.toHaveBeenCalled();
  });

  it("devolve o foco ao campo da placa ao escolher digitar", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Ler placa pela câmera" }));
    await user.click(screen.getByRole("button", { name: "digitar leitura" }));
    await waitFor(() => expect(screen.getByLabelText("Placa")).toHaveFocus());
  });

  it("desabilita o botão de câmera enquanto envia a entrada", async () => {
    vi.mocked(registrarEntrada).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Ler placa pela câmera" })).toBeDisabled());
  });
});

describe("EntradaVeiculoModal: mensalista", () => {
  const dadosMensalista = { nome: "Maria", intervaloPermitido: { de: "07:00", ate: "19:00" } };
  const cadastroBase = { placa: "ABC1D23", encontrado: true, origem: "mensalista", modelo: "ONIX", cor: "Vermelho", categoria: 2 };

  beforeEach(() => {
    vi.mocked(registrarEntrada).mockReset();
    vi.mocked(consultarPlaca).mockReset();
  });

  it("não oferece mais a marcação manual de mensalista", () => {
    renderModal();
    expect(screen.queryByText(/Mensalista/)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("mostra o card e envia mensalista quando a placa é de um mensalista no plano", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: true, dadosMensalista });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();

    expect(await screen.findByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("A entrada será registrada como mensalista.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ mensalista: true });
  });

  it("avisa que entra como rotativo quando o mensalista está fora do horário contratado", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: false, dadosMensalista });
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();

    expect(await screen.findByText("Mensalista fora do horário")).toBeInTheDocument();
    expect(screen.getByText("Horário contratado: 07:00 às 19:00.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ mensalista: false });
  });

  it("não mostra card para placa de avulso", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, origem: "base", mensalista: false });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Dados do cadastro preenchidos.");
    expect(screen.queryByRole("status", { name: /Mensalista/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Mensalista/)).not.toBeInTheDocument();
  });

  it("segue como avulso, sem card, quando a consulta da placa falha", async () => {
    vi.mocked(consultarPlaca).mockRejectedValue(new Error("rede"));
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText(/Não foi possível consultar a placa/);
    expect(screen.queryByText(/Mensalista/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));
    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));
    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(vi.mocked(registrarEntrada).mock.calls[0][0]).toMatchObject({ mensalista: false });
  });

  it("remove o card ao alterar a placa", async () => {
    vi.mocked(consultarPlaca).mockResolvedValue({ ...cadastroBase, mensalista: true, dadosMensalista });
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.tab();
    await screen.findByText("Maria");

    // A placa já tem 7 caracteres: apagar um altera o valor.
    await user.type(screen.getByLabelText("Placa"), "{backspace}");
    await waitFor(() => expect(screen.queryByText("Maria")).not.toBeInTheDocument());
  });
});

describe("EntradaVeiculoModal: lista do pátio", () => {
  it("registrar a entrada invalida a lista do pátio", async () => {
    vi.mocked(registrarEntrada).mockResolvedValue(registrada);
    const user = userEvent.setup();
    const { queryClient } = renderModal();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await screen.findByText("Entrada registrada");
    expect(invalidar).toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY });
  });

  it("uma entrada recusada não mexe na lista do pátio", async () => {
    vi.mocked(registrarEntrada).mockRejectedValue(new Error("Sem caixa aberto."));
    const user = userEvent.setup();
    const { queryClient } = renderModal();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");
    await user.type(screen.getByLabelText("Placa"), "abc1d23");
    await user.click(screen.getByRole("radio", { name: "Carro pequeno" }));

    await user.click(screen.getByRole("button", { name: "Registrar entrada" }));

    await waitFor(() => expect(registrarEntrada).toHaveBeenCalled());
    expect(invalidar).not.toHaveBeenCalledWith({ queryKey: PATIO_QUERY_KEY });
  });
});
