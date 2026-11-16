import { act, fireEvent, screen } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TECLADO_CAMPO_ATTR, TecladoProvider, useTeclado } from "@/components/teclado/TecladoProvider";
import type { TecladoConfig } from "@/lib/teclado/tipos";
import { renderWithTheme } from "@/test/render";
import { FRACAO_TECLADO_SISTEMA, useTecladoAberto } from "./useTecladoAberto";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const INTEIRO: TecladoConfig = { tipo: "numerico", modo: "inteiro" };

function Probe() {
  const aberto = useTecladoAberto();
  const { abrir, registrar } = useTeclado();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => (ref.current ? registrar(ref.current) : undefined), [registrar]);
  return (
    <>
      <input
        ref={ref}
        aria-label="valor"
        {...{ [TECLADO_CAMPO_ATTR]: "" }}
        onFocus={(evento) => abrir(evento.currentTarget, INTEIRO)}
      />
      <output aria-label="estado">{aberto ? "aberto" : "fechado"}</output>
    </>
  );
}

function renderProbe() {
  return renderWithTheme(
    <TecladoProvider>
      <Probe />
    </TecladoProvider>,
  );
}

// jsdom não tem visualViewport: um falso, só com o que o hook usa.
function simularVisualViewport(altura: number) {
  const ouvintes = new Set<() => void>();
  const area = {
    height: altura,
    addEventListener: (_: string, ouvinte: () => void) => ouvintes.add(ouvinte),
    removeEventListener: (_: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
  };
  vi.stubGlobal("visualViewport", area);
  Object.defineProperty(window, "visualViewport", { value: area, configurable: true });
  return {
    redimensionar(novaAltura: number) {
      area.height = novaAltura;
      act(() => ouvintes.forEach((ouvinte) => ouvinte()));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
});

describe("useTecladoAberto", () => {
  it("começa fechado", () => {
    renderProbe();
    expect(screen.getByLabelText("estado")).toHaveTextContent("fechado");
  });

  it("fica aberto enquanto o teclado do Murel está na tela", () => {
    renderProbe();

    act(() => screen.getByLabelText("valor").focus());
    expect(screen.getByLabelText("estado")).toHaveTextContent("aberto");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByLabelText("estado")).toHaveTextContent("fechado");
  });

  it("fica aberto quando a área visível encolhe (teclado do sistema) e volta ao normal depois", () => {
    const area = simularVisualViewport(800);
    vi.stubGlobal("innerHeight", 800);
    renderProbe();
    expect(screen.getByLabelText("estado")).toHaveTextContent("fechado");

    area.redimensionar(800 * FRACAO_TECLADO_SISTEMA - 1);
    expect(screen.getByLabelText("estado")).toHaveTextContent("aberto");

    area.redimensionar(800);
    expect(screen.getByLabelText("estado")).toHaveTextContent("fechado");
  });

  it("uma redução pequena (barra de endereço) não conta como teclado", () => {
    const area = simularVisualViewport(800);
    vi.stubGlobal("innerHeight", 800);
    renderProbe();

    area.redimensionar(740);
    expect(screen.getByLabelText("estado")).toHaveTextContent("fechado");
  });

  it("sem visualViewport não quebra", () => {
    Object.defineProperty(window, "visualViewport", { value: undefined, configurable: true });
    renderProbe();
    expect(screen.getByLabelText("estado")).toHaveTextContent("fechado");
  });
});
