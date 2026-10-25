import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/render";
import { Logo } from "./Logo";
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
