import { act, fireEvent, screen } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TecladoConfig } from "@/lib/teclado/tipos";
import { renderWithTheme } from "@/test/render";
import { TECLADO_CAMPO_ATTR, TecladoProvider, useTeclado } from "./TecladoProvider";

let caminho = "/a";
vi.mock("next/navigation", () => ({ usePathname: () => caminho }));

const INTEIRO: TecladoConfig = { tipo: "numerico", modo: "inteiro" };

function Campo({ nome, config = INTEIRO, max }: { nome: string; config?: TecladoConfig; max?: number }) {
  const { abrir, registrar } = useTeclado();
  const ref = useRef<HTMLInputElement>(null);
  const [valor, setValor] = useState("");
  useEffect(() => (ref.current ? registrar(ref.current) : undefined), [registrar]);
  return (
    <input
      ref={ref}
      aria-label={nome}
      value={valor}
      maxLength={max}
      {...{ [TECLADO_CAMPO_ATTR]: "" }}
      onChange={(evento) => setValor(evento.target.value)}
      onFocus={(evento) => abrir(evento.currentTarget, config)}
    />
  );
}

const campo = (nome: string) => screen.getByLabelText(nome) as HTMLInputElement;
const focar = (nome: string) => act(() => campo(nome).focus());
const tocar = (nome: string) => fireEvent.click(screen.getByRole("button", { name: nome }));
const folha = () => screen.queryByRole("group");

describe("TecladoProvider", () => {
  beforeEach(() => {
    caminho = "/a";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("não mostra teclado até um campo abrir", () => {
    renderWithTheme(
      <TecladoProvider>
        <Campo nome="valor" />
      </TecladoProvider>,
    );

    expect(folha()).toBeNull();
  });

  it("digita e apaga no campo pelas teclas", () => {
    renderWithTheme(
      <TecladoProvider>
        <Campo nome="valor" />
      </TecladoProvider>,
    );
    focar("valor");

    tocar("1");
    tocar("2");
    tocar("3");
    expect(campo("valor").value).toBe("123");

    tocar("Apagar");
    expect(campo("valor").value).toBe("12");
  });

  it("não insere o que a regra do campo recusa e respeita o maxLength", () => {
    renderWithTheme(
      <TecladoProvider>
        <Campo nome="valor" max={2} />
      </TecladoProvider>,
    );
    focar("valor");

    tocar("1");
    tocar("2");
    expect(screen.getByRole("button", { name: "3" })).toBeDisabled();
    expect(campo("valor").value).toBe("12");
  });

  it("devolve o foco ao campo depois de cada tecla", () => {
    renderWithTheme(
      <TecladoProvider>
        <Campo nome="valor" />
      </TecladoProvider>,
    );
    focar("valor");
    screen.getByRole("button", { name: "1" }).focus();

    tocar("1");

    expect(document.activeElement).toBe(campo("valor"));
  });

  it("Próximo leva ao campo seguinte e OK, no último, fecha o teclado", () => {
    renderWithTheme(
      <TecladoProvider>
        <form>
          <Campo nome="primeiro" />
          <Campo nome="segundo" config={{ tipo: "numerico", modo: "decimal" }} />
        </form>
      </TecladoProvider>,
    );
    focar("primeiro");
    expect(screen.getByRole("button", { name: "Próximo campo" })).toHaveTextContent("Próximo");

    tocar("Próximo campo");
    expect(document.activeElement).toBe(campo("segundo"));
    expect(folha()).not.toBeNull();
    expect(screen.getByRole("button", { name: "Concluir" })).toHaveTextContent("OK");

    tocar("Concluir");
    expect(folha()).toBeNull();
  });

  it("Próximo fecha o teclado quando o próximo campo não tem teclado próprio", () => {
    renderWithTheme(
      <TecladoProvider>
        <form>
          <Campo nome="primeiro" />
          <input aria-label="nativo" />
        </form>
      </TecladoProvider>,
    );
    focar("primeiro");

    tocar("Próximo campo");

    expect(document.activeElement).toBe(campo("nativo"));
    expect(folha()).toBeNull();
  });

  it("troca o teclado quando o próximo campo é de outro tipo", () => {
    renderWithTheme(
      <TecladoProvider>
        <form>
          <Campo nome="primeiro" />
          <Campo nome="segundo" config={{ tipo: "alfa" }} />
        </form>
      </TecladoProvider>,
    );
    focar("primeiro");
    expect(screen.getByRole("group", { name: "Teclado numérico" })).toBeInTheDocument();

    tocar("Próximo campo");

    expect(screen.getByRole("group", { name: "Teclado de letras e números" })).toBeInTheDocument();
  });

  it("alfa tira o espaço sobrando ao avançar", () => {
    renderWithTheme(
      <TecladoProvider>
        <form>
          <Campo nome="modelo" config={{ tipo: "alfa" }} />
          <Campo nome="outro" />
        </form>
      </TecladoProvider>,
    );
    focar("modelo");
    tocar("G");
    tocar("O");
    tocar("L");
    tocar("Espaço");
    expect(campo("modelo").value).toBe("GOL ");

    tocar("Próximo campo");

    expect(campo("modelo").value).toBe("GOL");
  });

  it("placa válida e completa fecha o teclado em ~150 ms", () => {
    vi.useFakeTimers();
    renderWithTheme(
      <TecladoProvider>
        <Campo nome="placa" config={{ tipo: "placa" }} />
      </TecladoProvider>,
    );
    focar("placa");

    for (const ch of ["A", "B", "C", "1", "D", "2"]) {
      tocar(ch);
    }
    expect(folha()).not.toBeNull();
    tocar("3");
    expect(campo("placa").value).toBe("ABC1D23");
    expect(folha()).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(folha()).toBeNull();
  });

  describe("fecha", () => {
    function abrirEmUmCampo() {
      const resultado = renderWithTheme(
        <TecladoProvider>
          <Campo nome="valor" />
          <button type="button">fora</button>
        </TecladoProvider>,
      );
      focar("valor");
      expect(folha()).not.toBeNull();
      return resultado;
    }

    it("ao tocar fora", () => {
      abrirEmUmCampo();

      fireEvent.pointerDown(screen.getByRole("button", { name: "fora" }));

      expect(folha()).toBeNull();
    });

    it("não fecha ao tocar no campo nem na folha", () => {
      abrirEmUmCampo();

      fireEvent.pointerDown(campo("valor"));
      fireEvent.pointerDown(screen.getByRole("button", { name: "1" }));

      expect(folha()).not.toBeNull();
    });

    it("com Escape", () => {
      abrirEmUmCampo();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(folha()).toBeNull();
    });

    it("quando a aba fica oculta", () => {
      abrirEmUmCampo();
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(folha()).toBeNull();
      Reflect.deleteProperty(document, "visibilityState");
    });

    it("na troca de rota", () => {
      const { rerender } = abrirEmUmCampo();
      caminho = "/b";

      rerender(
        <TecladoProvider>
          <Campo nome="valor" />
          <button type="button">fora</button>
        </TecladoProvider>,
      );

      expect(folha()).toBeNull();
    });

    it("quando o campo é desmontado", () => {
      const { rerender } = abrirEmUmCampo();

      rerender(<TecladoProvider>{null}</TecladoProvider>);

      expect(folha()).toBeNull();
    });
  });

  it("renderiza a folha dentro do <dialog> do campo", () => {
    renderWithTheme(
      <TecladoProvider>
        <dialog open data-testid="modal">
          <Campo nome="valor" />
        </dialog>
      </TecladoProvider>,
    );
    focar("valor");

    expect(screen.getByTestId("modal")).toContainElement(screen.getByRole("group"));
  });

  it("fora de um modal renderiza a folha no body", () => {
    renderWithTheme(
      <TecladoProvider>
        <Campo nome="valor" />
      </TecladoProvider>,
    );
    focar("valor");

    expect(screen.getByRole("group").parentElement).toBe(document.body);
  });
});
