import { act, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TecladoConfig } from "@/lib/teclado/tipos";
import { renderWithTheme } from "@/test/render";
import { TecladoProvider } from "./TecladoProvider";
import { MEDIA_TOQUE, useTecladoCampo } from "./useTecladoCampo";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function simularToque(ativo: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: ativo && query === MEDIA_TOQUE,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

interface CampoProps {
  teclado?: TecladoConfig;
  maxLength?: number;
  inputMode?: "decimal";
  onFocus?: () => void;
  onPaste?: () => void;
}

function Campo({ teclado, maxLength, inputMode, onFocus, onPaste }: CampoProps) {
  const [valor, setValor] = useState("");
  const extras = useTecladoCampo(teclado, { inputMode, onFocus, onPaste });
  return <input aria-label="campo" value={valor} maxLength={maxLength} inputMode={inputMode} onChange={(e) => setValor(e.target.value)} {...extras} />;
}

const renderizar = (props: CampoProps) =>
  renderWithTheme(
    <TecladoProvider>
      <Campo {...props} />
    </TecladoProvider>,
  );
const campo = () => screen.getByLabelText("campo") as HTMLInputElement;

function digitar(data: string) {
  const evento = new InputEvent("beforeinput", { data, inputType: "insertText", bubbles: true, cancelable: true });
  fireEvent(campo(), evento);
  return evento.defaultPrevented;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTecladoCampo", () => {
  describe("em aparelho de toque", () => {
    it("troca para inputMode none e abre o teclado ao focar", () => {
      simularToque(true);
      renderizar({ teclado: { tipo: "numerico", modo: "decimal" }, inputMode: "decimal" });

      expect(campo()).toHaveAttribute("inputmode", "none");
      expect(campo()).toHaveAttribute("aria-controls", "teclado-folha");

      act(() => campo().focus());

      expect(screen.getByRole("group", { name: "Teclado numérico" })).toBeInTheDocument();
    });

    it("abre também ao tocar no campo já focado", () => {
      simularToque(true);
      renderizar({ teclado: { tipo: "alfa" } });
      act(() => campo().focus());
      fireEvent.pointerDown(document.body);
      expect(screen.queryByRole("group")).toBeNull();

      fireEvent.click(campo());

      expect(screen.getByRole("group", { name: "Teclado de letras e números" })).toBeInTheDocument();
    });

    it("tocar fora do campo fecha e tocar no campo não", () => {
      simularToque(true);
      renderizar({ teclado: { tipo: "alfa" } });
      act(() => campo().focus());

      fireEvent.pointerDown(campo());

      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("compõe os handlers da tela sem sobrescrevê-los", () => {
      simularToque(true);
      const onFocus = vi.fn();
      renderizar({ teclado: { tipo: "alfa" }, onFocus });

      act(() => campo().focus());

      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("group")).toBeInTheDocument();
    });
  });

  describe("no computador", () => {
    it("mantém o inputMode original e não abre o teclado", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "numerico", modo: "decimal" }, inputMode: "decimal" });

      act(() => campo().focus());

      expect(campo()).toHaveAttribute("inputmode", "decimal");
      expect(campo()).not.toHaveAttribute("aria-controls");
      expect(screen.queryByRole("group")).toBeNull();
    });

    it("filtra o teclado físico com a mesma regra do teclado de toque", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "numerico", modo: "inteiro" } });

      expect(digitar("a")).toBe(true);
      expect(digitar(",")).toBe(true);
      expect(digitar("7")).toBe(false);
    });

    it("filtra a placa por posição", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "placa" } });

      expect(digitar("1")).toBe(true);
      expect(digitar("A")).toBe(false);
    });

    it("deixa passar a minúscula e barra o acento no alfa", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "alfa" } });

      expect(digitar("g")).toBe(false);
      expect(digitar("ç")).toBe(true);
    });

    it("respeita o limite do campo considerando o texto depois da seleção", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "numerico", modo: "inteiro" }, maxLength: 3 });
      fireEvent.change(campo(), { target: { value: "123" } });

      expect(digitar("4")).toBe(true);
    });

    it("limpa o texto colado pela regra do campo", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "placa" } });

      fireEvent.paste(campo(), { clipboardData: { getData: () => "abc-1d23" } });

      expect(campo().value).toBe("ABC1D23");
    });

    it("cola só os dígitos num campo inteiro", () => {
      simularToque(false);
      renderizar({ teclado: { tipo: "numerico", modo: "inteiro" } });

      fireEvent.paste(campo(), { clipboardData: { getData: () => "1a2,3" } });

      expect(campo().value).toBe("123");
    });

    it("chama o onPaste da tela e respeita o preventDefault dela", () => {
      simularToque(false);
      const onPaste = vi.fn();
      renderizar({ teclado: { tipo: "alfa" }, onPaste });

      fireEvent.paste(campo(), { clipboardData: { getData: () => "gol" } });

      expect(onPaste).toHaveBeenCalledTimes(1);
      expect(campo().value).toBe("GOL");
    });
  });

  it("sem teclado não muda nada no campo", () => {
    simularToque(true);
    renderizar({ inputMode: "decimal" });

    expect(campo()).toHaveAttribute("inputmode", "decimal");
    expect(digitar("a")).toBe(false);
    act(() => campo().focus());
    expect(screen.queryByRole("group")).toBeNull();
  });
});
