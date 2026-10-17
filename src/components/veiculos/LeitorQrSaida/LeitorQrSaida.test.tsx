import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { BUSCANDO_MESSAGE, LeitorQrSaida, QR_INVALIDO_MESSAGE, type LeitorQrSaidaProps } from "./LeitorQrSaida";
import type { LeitorQrEstado, UseLeitorQrOptions } from "./useLeitorQr";

const leitor = vi.hoisted(() => ({
  estado: "lendo" as LeitorQrEstado,
  options: null as UseLeitorQrOptions | null,
  iniciar: vi.fn(),
}));

vi.mock("./useLeitorQr", async () => {
  const { createRef } = await import("react");
  return {
    useLeitorQr: (options: UseLeitorQrOptions) => {
      leitor.options = options;
      return { videoRef: createRef(), estado: leitor.estado, iniciar: leitor.iniciar };
    },
  };
});

function renderLeitor(props: Partial<LeitorQrSaidaProps> = {}) {
  const handlers = { onToken: vi.fn(), onInvalido: vi.fn() };
  renderWithTheme(<LeitorQrSaida {...handlers} {...props} />);
  return handlers;
}

const ler = (texto: string) => act(() => leitor.options!.onTexto(texto));
const visor = () => screen.getByRole("button", { name: /Área de leitura do QR Code/ });

beforeEach(() => {
  leitor.estado = "lendo";
  leitor.options = null;
  leitor.iniciar.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LeitorQrSaida", () => {
  it("liga a câmera enquanto não houver leitura", () => {
    renderLeitor();
    expect(leitor.options?.ativo).toBe(true);
  });

  it("entrega o token do link do cupom e do token solto", () => {
    const { onToken } = renderLeitor();
    ler("https://gipe.com.br/comprovante/7K3Q9X");
    expect(onToken).toHaveBeenLastCalledWith("7K3Q9X");
    ler("P4M8TQ");
    expect(onToken).toHaveBeenLastCalledWith("P4M8TQ");
  });

  it("avisa QR inválido, anuncia o motivo e volta ao normal depois de um instante", () => {
    vi.useFakeTimers();
    const { onToken, onInvalido } = renderLeitor();
    ler("https://outro-site.com/promo");
    expect(onToken).not.toHaveBeenCalled();
    expect(onInvalido).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(QR_INVALIDO_MESSAGE);
    act(() => vi.advanceTimersByTime(1300));
    expect(screen.getByRole("status")).not.toHaveTextContent(QR_INVALIDO_MESSAGE);
  });

  it.each([
    ["ocioso", "Toque para ativar a câmera"],
    ["abrindo", "Abrindo câmera…"],
    ["negada", "Permita o acesso à câmera e toque aqui"],
    ["indisponivel", "Câmera indisponível neste navegador"],
  ] as const)("explica o estado %s", (estado, texto) => {
    leitor.estado = estado;
    renderLeitor();
    expect(screen.getAllByText(texto).length).toBeGreaterThan(0);
  });

  it("não mostra mensagem de apoio enquanto lê", () => {
    renderLeitor();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("tenta abrir a câmera ao tocar no visor", () => {
    renderLeitor();
    fireEvent.click(visor());
    expect(leitor.iniciar).toHaveBeenCalled();
  });

  it("não tem botão de limpar nem estado de leitura concluída", () => {
    renderLeitor();
    expect(screen.queryByRole("button", { name: /Limpar/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  describe("durante a busca", () => {
    it("pausa a câmera", () => {
      renderLeitor({ buscando: true });
      expect(leitor.options?.ativo).toBe(false);
    });

    it("anuncia a busca e esconde a mensagem de apoio", () => {
      leitor.estado = "ocioso";
      renderLeitor({ buscando: true });
      expect(screen.getByRole("status")).toHaveTextContent(BUSCANDO_MESSAGE);
      expect(screen.queryByText("Toque para ativar a câmera")).not.toBeInTheDocument();
    });

    it("religa a câmera quando a busca termina sem sucesso", () => {
      const { rerender } = renderWithTheme(
        <LeitorQrSaida buscando onToken={() => {}} onInvalido={() => {}} />,
      );
      expect(leitor.options?.ativo).toBe(false);
      rerender(<LeitorQrSaida onToken={() => {}} onInvalido={() => {}} />);
      expect(leitor.options?.ativo).toBe(true);
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });
  });
});
