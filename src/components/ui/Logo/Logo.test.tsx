import { act, createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/render";
import { Logo, type LogoHandle } from "./Logo";
import { MurelSymbol } from "./MurelSymbol";

describe("Logo", () => {
  it("é lido como Murel e mostra a palavra no logotipo completo", () => {
    renderWithTheme(<Logo />);

    expect(screen.getByRole("img", { name: "Murel" })).toBeInTheDocument();
    expect(screen.getByText("murel")).toBeInTheDocument();
  });

  it("na variante símbolo não mostra a palavra, mas continua sendo lido como Murel", () => {
    renderWithTheme(<Logo variant="symbol" />);

    expect(screen.getByRole("img", { name: "Murel" })).toBeInTheDocument();
    expect(screen.queryByText("murel")).not.toBeInTheDocument();
  });

  it("respeita o tamanho mínimo da marca", () => {
    const { container, rerender } = renderWithTheme(<Logo size={10} />);
    expect(container.querySelector("svg")).toHaveAttribute("height", "24");

    rerender(<Logo variant="symbol" size={10} />);
    expect(container.querySelector("svg")).toHaveAttribute("height", "16");
  });

  it("dois logotipos na mesma página usam máscaras com ids diferentes", () => {
    const { container } = renderWithTheme(
      <>
        <Logo />
        <Logo variant="symbol" />
      </>,
    );

    const ids = Array.from(container.querySelectorAll("mask")).map((mask) => mask.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    container.querySelectorAll("rect[mask]").forEach((rect, index) => {
      expect(rect.getAttribute("mask")).toBe(`url(#${ids[index]})`);
    });
  });

  it("o carro é amarelo e, sobre fundo amarelo, tudo vira asfalto", () => {
    const { container, rerender } = renderWithTheme(<Logo />);
    expect(container.querySelector("rect[mask]")).toHaveAttribute("fill", "#FFC20E");

    rerender(<Logo tone="onYellow" />);
    expect(container.querySelector("rect[mask]")).toHaveAttribute("fill", "#0E1729");
    expect(container.querySelector("path[stroke-linecap]")).toHaveAttribute("stroke", "#0E1729");
  });
});

describe("MurelSymbol", () => {
  it("é decorativo sem rótulo e vira imagem nomeada com rótulo", () => {
    const { container, rerender } = renderWithTheme(<MurelSymbol />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    rerender(<MurelSymbol label="Símbolo Murel" />);
    expect(screen.getByRole("img", { name: "Símbolo Murel" })).toBeInTheDocument();
  });
});

describe("Logo animado", () => {
  let quadros: FrameRequestCallback[];

  function simularMovimento(reduzido: boolean) {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: reduzido && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  }

  beforeEach(() => {
    quadros = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      quadros.push(callback);
      return quadros.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sem movimento reduzido, anima e desenha as luzes do carro", () => {
    simularMovimento(false);
    const { container } = renderWithTheme(<Logo animated />);

    expect(quadros.length).toBeGreaterThan(0);
    expect(container.querySelector("[data-luz]")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Murel" })).toBeInTheDocument();
  });

  it("com movimento reduzido não anima", () => {
    simularMovimento(true);
    renderWithTheme(<Logo animated />);

    expect(quadros).toHaveLength(0);
  });

  it("sobre fundo amarelo não anima nem desenha luzes", () => {
    simularMovimento(false);
    const { container } = renderWithTheme(<Logo animated tone="onYellow" />);

    expect(quadros).toHaveLength(0);
    expect(container.querySelector("[data-luz]")).not.toBeInTheDocument();
  });

  it("sem animated o símbolo é o estático, sem luzes", () => {
    simularMovimento(false);
    const { container } = renderWithTheme(<Logo />);

    expect(quadros).toHaveLength(0);
    expect(container.querySelector("[data-luz]")).not.toBeInTheDocument();
    expect(container.querySelector("[data-carro]")).not.toBeInTheDocument();
  });

  it("parar pelo ref devolve true durante a animação, false depois, e não recomeça", () => {
    simularMovimento(false);
    const ref = createRef<LogoHandle>();
    renderWithTheme(<Logo animated ref={ref} />);

    let parou = false;
    act(() => {
      parou = ref.current?.parar() ?? false;
    });
    expect(parou).toBe(true);
    expect(ref.current?.parar()).toBe(false);

    const agendados = quadros.length;
    act(() => {
      quadros.at(-1)?.(16);
    });
    expect(quadros).toHaveLength(agendados);
  });

  it("tocar no logo para a animação", () => {
    simularMovimento(false);
    const ref = createRef<LogoHandle>();
    renderWithTheme(<Logo animated ref={ref} />);

    act(() => {
      fireEvent.pointerDown(screen.getByRole("img", { name: "Murel" }));
    });
    expect(ref.current?.parar()).toBe(false);
  });

  it("com pararAoInteragir desligado, tocar não para (quem controla é o ref)", () => {
    simularMovimento(false);
    const ref = createRef<LogoHandle>();
    renderWithTheme(<Logo animated ref={ref} pararAoInteragir={false} />);

    fireEvent.pointerDown(screen.getByRole("img", { name: "Murel" }));
    let parou = false;
    act(() => {
      parou = ref.current?.parar() ?? false;
    });
    expect(parou).toBe(true);
  });

  it("move o carro a cada quadro e, no fim, termina na vaga", () => {
    simularMovimento(false);
    const { container } = renderWithTheme(<Logo animated />);
    const carro = container.querySelector("[data-carro]");

    act(() => {
      // Dois quadros com 50ms de intervalo (o teto) avançam o tempo; depois, vários até passar do fim.
      quadros.at(-1)?.(0);
      quadros.at(-1)?.(50);
    });
    expect(carro).toHaveAttribute("transform");

    act(() => {
      let agora = 50;
      for (let i = 0; i < 600 && quadros.length < 2000; i += 1) {
        agora += 50;
        quadros.at(-1)?.(agora);
      }
    });
    expect(carro?.getAttribute("transform")).toBe("translate(0.00 0.00) rotate(0.00 120 95)");
  });
});
