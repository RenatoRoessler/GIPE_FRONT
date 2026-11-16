import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CONFIRMACAO_AUTOMATICA_MS, LeitorPlacaModal, type LeitorPlacaModalProps } from "./LeitorPlacaModal";
import type { LeitorPlacaEstado, UseLeitorPlacaOptions } from "./useLeitorPlaca";

const leitor = vi.hoisted(() => ({
  estado: "lendo" as LeitorPlacaEstado,
  contextoSeguro: true,
  options: null as UseLeitorPlacaOptions | null,
  iniciar: vi.fn(),
}));

vi.mock("./useLeitorPlaca", async () => {
  const { createRef } = await import("react");
  return {
    useLeitorPlaca: (options: UseLeitorPlacaOptions) => {
      leitor.options = options;
      return {
        videoRef: createRef(),
        estado: options.ativo ? leitor.estado : "ocioso",
        contextoSeguro: leitor.contextoSeguro,
        iniciar: leitor.iniciar,
      };
    },
  };
});

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  leitor.estado = "lendo";
  leitor.contextoSeguro = true;
  leitor.options = null;
  leitor.iniciar.mockReset();
});

function renderModal(props: Partial<LeitorPlacaModalProps> = {}) {
  const handlers = { onClose: vi.fn(), onConfirm: vi.fn() };
  renderWithTheme(<LeitorPlacaModal open {...handlers} {...props} />);
  return handlers;
}

const lerPlaca = (placa: string) => act(() => leitor.options!.onPlaca(placa, { duvida: null }));
// Leitura em que o caractere (posição, base 0) variou entre os quadros: vai para a conferência.
const lerPlacaDuvidosa = (placa: string, duvida = 6) => act(() => leitor.options!.onPlaca(placa, { duvida }));

describe("LeitorPlacaModal", () => {
  it("não renderiza nada fechado", () => {
    renderWithTheme(<LeitorPlacaModal open={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByText("Ler placa")).not.toBeInTheDocument();
    expect(leitor.options).toBeNull();
  });

  it("mostra a orientação de leitura e a câmera ligada", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: "Ler placa" })).toBeInTheDocument();
    expect(screen.getAllByText("Aponte a câmera para a placa").length).toBeGreaterThan(0);
    expect(leitor.options?.ativo).toBe(true);
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("cancela a leitura sem confirmar nada", async () => {
    const { onClose, onConfirm } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("leitura em dúvida vai para a conferência e desliga a câmera", async () => {
    renderModal();
    await lerPlacaDuvidosa("ABC1D23");
    expect(screen.getByRole("heading", { name: "Confirmar placa" })).toBeInTheDocument();
    expect(screen.getByLabelText("Placa lida")).toHaveValue("ABC1D23");
    expect(leitor.options?.ativo).toBe(false);
  });

  it("confirma a placa lida", async () => {
    const { onConfirm } = renderModal();
    await lerPlacaDuvidosa("ABC1D23");
    await userEvent.click(screen.getByRole("button", { name: "Usar placa" }));
    expect(onConfirm).toHaveBeenCalledWith("ABC1D23");
  });

  it("permite corrigir a placa na conferência e só libera com placa válida", async () => {
    const { onConfirm } = renderModal();
    await lerPlacaDuvidosa("ABC1D23");
    const campo = screen.getByLabelText("Placa lida");

    await userEvent.clear(campo);
    await userEvent.type(campo, "xyz9k88");
    expect(campo).toHaveValue("XYZ9K88");
    await userEvent.click(screen.getByRole("button", { name: "Usar placa" }));
    expect(onConfirm).toHaveBeenCalledWith("XYZ9K88");

    await userEvent.clear(campo);
    await userEvent.type(campo, "XYZ");
    expect(screen.getByRole("button", { name: "Usar placa" })).toBeDisabled();
  });

  it("volta a ler com 'Ler de novo'", async () => {
    renderModal();
    await lerPlacaDuvidosa("ABC1D23");
    await userEvent.click(screen.getByRole("button", { name: "Ler de novo" }));
    expect(screen.getByRole("heading", { name: "Ler placa" })).toBeInTheDocument();
    expect(leitor.options?.ativo).toBe(true);
  });

  it("oferece tentar de novo ou digitar quando não consegue ler", async () => {
    leitor.estado = "sem-leitura";
    const onDigitar = vi.fn();
    renderModal({ onDigitar });
    expect(screen.getAllByText("Não consegui ler a placa. Tente de novo ou digite.").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(leitor.iniciar).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Digitar" }));
    expect(onDigitar).toHaveBeenCalledTimes(1);
  });

  it("'Digitar' só fecha quando não há outra ação definida", async () => {
    leitor.estado = "sem-leitura";
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Digitar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("explica como liberar a câmera negada, com os passos do navegador", () => {
    leitor.estado = "negada";
    renderModal();
    expect(screen.getAllByText(/Permita o acesso à câmera/).length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: "Como liberar a câmera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("enquanto o navegador pergunta, explica para que a câmera serve e segue com Cancelar e a leitura", () => {
    leitor.estado = "pedindo";
    renderModal();
    expect(screen.getByRole("group", { name: "Permissão da câmera" })).toHaveTextContent("ler a placa do veículo");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("avisa quando a câmera não está disponível, sem oferecer tentar de novo", () => {
    leitor.estado = "indisponivel";
    renderModal();
    expect(screen.getAllByText("A câmera não está disponível neste aparelho ou navegador.").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digitar" })).toBeInTheDocument();
  });

  it("avisa quando falta conexão segura", () => {
    leitor.estado = "indisponivel";
    leitor.contextoSeguro = false;
    renderModal();
    expect(screen.getAllByText("A câmera só funciona em conexão segura (HTTPS).").length).toBeGreaterThan(0);
  });

  it("anuncia a mensagem para leitores de tela", () => {
    renderModal();
    expect(screen.getByRole("status")).toHaveTextContent("Aponte a câmera para a placa");
  });
});

describe("LeitorPlacaModal: onFalha", () => {
  it.each(["negada", "indisponivel"] as const)("câmera %s avisa quem abriu e não mostra a tela de erro", (estado) => {
    leitor.estado = estado;
    const onFalha = vi.fn();
    renderModal({ onFalha });

    expect(onFalha).toHaveBeenCalledTimes(1);
    expect(onFalha).toHaveBeenCalledWith(estado);
    expect(screen.queryByRole("heading", { name: "Ler placa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });

  it("não avisa enquanto a câmera funciona", () => {
    const onFalha = vi.fn();
    renderModal({ onFalha });
    expect(onFalha).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Ler placa" })).toBeInTheDocument();
  });

  it("sem tempo de leitura (sem-leitura) mantém a tela com Tentar de novo e Digitar, sem avisar", () => {
    leitor.estado = "sem-leitura";
    const onFalha = vi.fn();
    renderModal({ onFalha });

    expect(onFalha).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Digitar" })).toBeInTheDocument();
  });

  it("sem onFalha continua mostrando a explicação da câmera bloqueada", () => {
    leitor.estado = "negada";
    renderModal();
    expect(screen.getByRole("group", { name: "Como liberar a câmera" })).toBeInTheDocument();
  });

  it("avisa uma vez só, mesmo com novos renders", () => {
    leitor.estado = "negada";
    const onFalha = vi.fn();
    const { rerender } = renderWithTheme(<LeitorPlacaModal open onClose={vi.fn()} onConfirm={vi.fn()} onFalha={onFalha} />);
    rerender(<LeitorPlacaModal open onClose={vi.fn()} onConfirm={vi.fn()} onFalha={onFalha} />);
    expect(onFalha).toHaveBeenCalledTimes(1);
  });
});

describe("LeitorPlacaModal: imagem antes do leitor", () => {
  it("com a imagem na tela e o leitor carregando, o aviso é uma pílula sobre a imagem", () => {
    leitor.estado = "pre-leitura";
    renderModal();

    // Pílula visível + a mesma frase para o leitor de tela.
    expect(screen.getAllByText("Preparando leitura…")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("Preparando leitura…");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("enquanto a câmera abre, o visor fica limpo, sem texto grande", () => {
    leitor.estado = "abrindo";
    renderModal();

    // Só a frase para o leitor de tela: nada visível além da moldura.
    expect(screen.getAllByText("Preparando leitura…")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Preparando leitura…");
  });

  it("lendo, a pílula some e vale a orientação abaixo do visor", () => {
    leitor.estado = "lendo";
    renderModal();

    expect(screen.queryByText("Preparando leitura…")).not.toBeInTheDocument();
    expect(screen.getAllByText("Aponte a câmera para a placa")).toHaveLength(2);
  });
});

describe("LeitorPlacaModal: confirmação da leitura", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("leitura certa: a mira fica verde, diz a placa lida e o fluxo segue sozinho em meio segundo", async () => {
    const { onConfirm } = renderModal();

    await lerPlaca("ABC1D23");

    expect(screen.getAllByText("Placa lida: ABC1D23").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Confirmar placa" })).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await act(async () => void (await vi.advanceTimersByTimeAsync(CONFIRMACAO_AUTOMATICA_MS - 1)));
    expect(onConfirm).not.toHaveBeenCalled();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("ABC1D23");
  });

  it("fechar o leitor antes do meio segundo cancela a confirmação automática", async () => {
    const { onConfirm } = renderModal();
    await lerPlaca("ABC1D23");

    cleanup();
    await act(async () => void (await vi.advanceTimersByTimeAsync(CONFIRMACAO_AUTOMATICA_MS * 2)));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("leitura em dúvida não segue sozinha: vai para a conferência com o caractere em dúvida destacado", async () => {
    const { onConfirm } = renderModal();

    await lerPlacaDuvidosa("ABC1D23", 6);

    expect(screen.getByRole("heading", { name: "Confirmar placa" })).toBeInTheDocument();
    const aviso = screen.getByText(/Confira o 7º caractere/);
    expect(aviso).toHaveTextContent("Confira o 7º caractere: ABC1D23");
    expect(aviso.querySelector("mark")).toHaveTextContent("3");

    await act(async () => void (await vi.advanceTimersByTimeAsync(CONFIRMACAO_AUTOMATICA_MS * 2)));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("corrigir a placa na conferência tira o destaque, que já não vale", async () => {
    vi.useRealTimers();
    renderModal();
    await lerPlacaDuvidosa("ABC1D23", 6);
    expect(screen.getByText(/Confira o 7º caractere/)).toBeInTheDocument();

    const campo = screen.getByLabelText("Placa lida");
    await userEvent.clear(campo);
    await userEvent.type(campo, "ABC1D28");

    expect(screen.queryByText(/Confira o 7º caractere/)).not.toBeInTheDocument();
  });

  it("Ler de novo depois de uma dúvida volta ao visor sem restos da leitura anterior", async () => {
    vi.useRealTimers();
    renderModal();
    await lerPlacaDuvidosa("ABC1D23", 6);

    await userEvent.click(screen.getByRole("button", { name: "Ler de novo" }));

    expect(screen.getByRole("heading", { name: "Ler placa" })).toBeInTheDocument();
    expect(screen.queryByText(/Placa lida:/)).not.toBeInTheDocument();
  });
});
