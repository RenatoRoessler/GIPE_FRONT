import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { LeitorPlacaModal, type LeitorPlacaModalProps } from "./LeitorPlacaModal";
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
    MOLDURA_LARGURA: 0.8,
    MOLDURA_PROPORCAO: 3,
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

const lerPlaca = (placa: string) => act(() => leitor.options!.onPlaca(placa));

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

  it("vai para a conferência ao ler a placa e desliga a câmera", async () => {
    renderModal();
    await lerPlaca("ABC1D23");
    expect(screen.getByRole("heading", { name: "Confirmar placa" })).toBeInTheDocument();
    expect(screen.getByLabelText("Placa lida")).toHaveValue("ABC1D23");
    expect(leitor.options?.ativo).toBe(false);
  });

  it("confirma a placa lida", async () => {
    const { onConfirm } = renderModal();
    await lerPlaca("ABC1D23");
    await userEvent.click(screen.getByRole("button", { name: "Usar placa" }));
    expect(onConfirm).toHaveBeenCalledWith("ABC1D23");
  });

  it("permite corrigir a placa na conferência e só libera com placa válida", async () => {
    const { onConfirm } = renderModal();
    await lerPlaca("ABC1D23");
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
    await lerPlaca("ABC1D23");
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

  it("explica como liberar a câmera negada", () => {
    leitor.estado = "negada";
    renderModal();
    expect(screen.getAllByText(/Permita o acesso à câmera/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
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
