import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("expõe valor, mínimo, máximo e nome", () => {
    renderWithTheme(<ProgressBar value={34} max={42} aria-label="Progresso da conferência" />);
    const barra = screen.getByRole("progressbar", { name: "Progresso da conferência" });
    expect(barra).toHaveAttribute("aria-valuenow", "34");
    expect(barra).toHaveAttribute("aria-valuemin", "0");
    expect(barra).toHaveAttribute("aria-valuemax", "42");
  });

  it("preenche pela proporção, com transform", () => {
    renderWithTheme(<ProgressBar value={21} max={42} aria-label="Progresso" />);
    expect(screen.getByRole("progressbar").firstChild).toHaveStyle({ transform: "scaleX(0.5)" });
  });

  it.each([
    [0, 10, "0", "scaleX(0)"],
    [10, 10, "10", "scaleX(1)"],
    [15, 10, "10", "scaleX(1)"],
    [-3, 10, "0", "scaleX(0)"],
    [0, 0, "0", "scaleX(0)"],
  ])("limita o valor %i de %i", (value, max, esperado, transform) => {
    renderWithTheme(<ProgressBar value={value} max={max} aria-label="Progresso" />);
    const barra = screen.getByRole("progressbar");
    expect(barra).toHaveAttribute("aria-valuenow", esperado);
    expect(barra.firstChild).toHaveStyle({ transform });
  });
});
