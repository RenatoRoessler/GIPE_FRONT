import { createEvent, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { KeyboardSheet } from "./KeyboardSheet";

let aoRedimensionar: (() => void) | null = null;

describe("KeyboardSheet", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          aoRedimensionar = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    aoRedimensionar = null;
  });

  it("é um grupo acessível com o nome recebido", () => {
    renderWithTheme(
      <KeyboardSheet ariaLabel="Teclado numérico">
        <button type="button">1</button>
      </KeyboardSheet>,
    );

    expect(screen.getByRole("group", { name: "Teclado numérico" })).toBeInTheDocument();
  });

  it("cancela o pointerdown para o campo não perder o foco", () => {
    renderWithTheme(
      <KeyboardSheet ariaLabel="Teclado numérico">
        <button type="button">1</button>
      </KeyboardSheet>,
    );

    const evento = createEvent.pointerDown(screen.getByRole("button", { name: "1" }));
    fireEvent(screen.getByRole("button", { name: "1" }), evento);

    expect(evento.defaultPrevented).toBe(true);
  });

  it("publica a altura e a marca de aberto, e limpa ao desmontar", () => {
    const { unmount } = renderWithTheme(
      <KeyboardSheet ariaLabel="Teclado numérico">
        <span>x</span>
      </KeyboardSheet>,
    );
    const raiz = document.documentElement;

    expect(raiz.style.getPropertyValue("--teclado-altura")).toBe("0px");
    expect(raiz).toHaveAttribute("data-teclado", "aberto");

    const folha = screen.getByRole("group");
    Object.defineProperty(folha, "offsetHeight", { value: 264, configurable: true });
    aoRedimensionar?.();
    expect(raiz.style.getPropertyValue("--teclado-altura")).toBe("264px");

    unmount();

    expect(raiz.style.getPropertyValue("--teclado-altura")).toBe("");
    expect(raiz).not.toHaveAttribute("data-teclado");
  });
});
