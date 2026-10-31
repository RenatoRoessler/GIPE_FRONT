import { screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { Input } from "@/components/ui/Input";
import { renderWithTheme } from "@/test/render";
import { Modal } from "./Modal";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

// jsdom não implementa <dialog>; como o navegador, showModal foca o primeiro controle (o "×").
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Modal", () => {
  it("sem data-autofocus o foco fica no primeiro controle", () => {
    renderWithTheme(
      <Modal open title="Teste" onClose={vi.fn()}>
        <input aria-label="Campo" />
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("o campo marcado com data-autofocus recebe o foco depois de abrir", () => {
    renderWithTheme(
      <Modal open title="Teste" onClose={vi.fn()}>
        <input aria-label="Campo" data-autofocus="" />
      </Modal>,
    );
    expect(screen.getByLabelText("Campo")).toHaveFocus();
  });

  describe("com o teclado do celular", () => {
    function simularToque() {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === MEDIA_TOQUE,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
    }

    it("o campo com data-autofocus abre o teclado dentro do <dialog>", () => {
      simularToque();
      renderWithTheme(
        <TecladoProvider>
          <Modal open title="Teste" onClose={vi.fn()}>
            <Input label="Valor" data-autofocus="" teclado={{ tipo: "numerico", modo: "decimal" }} />
          </Modal>
        </TecladoProvider>,
      );

      const folha = screen.getByRole("group", { name: "Teclado numérico" });
      expect(folha.closest("dialog")).not.toBeNull();
    });

    it("o foco que cai no botão × ao abrir (ou volta a um botão ao fechar) não abre o teclado", () => {
      simularToque();
      renderWithTheme(
        <TecladoProvider>
          <Modal open title="Teste" onClose={vi.fn()}>
            <Input label="Valor" teclado={{ tipo: "numerico", modo: "decimal" }} />
          </Modal>
        </TecladoProvider>,
      );

      expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });

    it("fecha o teclado junto com o modal, mesmo com o campo montado", () => {
      simularToque();
      const { rerender } = renderWithTheme(
        <TecladoProvider>
          <Modal open title="Teste" onClose={vi.fn()}>
            <Input label="Valor" data-autofocus="" teclado={{ tipo: "numerico", modo: "decimal" }} />
          </Modal>
        </TecladoProvider>,
      );
      expect(screen.getByRole("group")).toBeInTheDocument();

      rerender(
        <TecladoProvider>
          <Modal open={false} title="Teste" onClose={vi.fn()}>
            <Input label="Valor" data-autofocus="" teclado={{ tipo: "numerico", modo: "decimal" }} />
          </Modal>
        </TecladoProvider>,
      );

      expect(screen.queryByRole("group", { hidden: true })).not.toBeInTheDocument();
    });
  });
});
