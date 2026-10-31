import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { renderWithTheme } from "@/test/render";
import { Input } from "./Input";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function simularToque(ativo: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: ativo && query === MEDIA_TOQUE,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Input", () => {
  it("renderiza só o campo quando não há ação à direita", () => {
    renderWithTheme(<Input label="Placa" />);
    expect(screen.getByLabelText("Placa")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mostra a ação à direita do campo", () => {
    renderWithTheme(<Input label="Placa" endAction={<button type="button">Ler</button>} />);
    expect(screen.getByLabelText("Placa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ler" })).toBeInTheDocument();
  });

  it("mantém o botão de senha e ignora a ação em campos de senha", () => {
    renderWithTheme(<Input label="Senha" type="password" endAction={<button type="button">Ler</button>} />);
    expect(screen.getByRole("button", { name: /mostrar senha/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ler" })).not.toBeInTheDocument();
  });

  describe("teclado", () => {
    it("em aparelho de toque usa inputMode none e abre o teclado ao focar", () => {
      simularToque(true);
      renderWithTheme(
        <TecladoProvider>
          <Input label="Valor" inputMode="decimal" teclado={{ tipo: "numerico", modo: "decimal" }} />
        </TecladoProvider>,
      );

      expect(screen.getByLabelText("Valor")).toHaveAttribute("inputmode", "none");
      act(() => screen.getByLabelText("Valor").focus());

      expect(screen.getByRole("group", { name: "Teclado numérico" })).toBeInTheDocument();
    });

    it("no computador mantém o inputMode e filtra o que se digita", () => {
      simularToque(false);
      renderWithTheme(
        <TecladoProvider>
          <Input label="Valor" inputMode="decimal" teclado={{ tipo: "numerico", modo: "inteiro" }} />
        </TecladoProvider>,
      );
      const campo = screen.getByLabelText("Valor");
      act(() => campo.focus());

      const letra = new InputEvent("beforeinput", { data: "a", inputType: "insertText", bubbles: true, cancelable: true });
      fireEvent(campo, letra);
      const digito = new InputEvent("beforeinput", { data: "5", inputType: "insertText", bubbles: true, cancelable: true });
      fireEvent(campo, digito);

      expect(campo).toHaveAttribute("inputmode", "decimal");
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
      expect(letra.defaultPrevented).toBe(true);
      expect(digito.defaultPrevented).toBe(false);
    });

    it("sem a prop se comporta como antes", () => {
      simularToque(true);
      renderWithTheme(<Input label="Valor" inputMode="decimal" />);

      expect(screen.getByLabelText("Valor")).toHaveAttribute("inputmode", "decimal");
    });
  });
});
