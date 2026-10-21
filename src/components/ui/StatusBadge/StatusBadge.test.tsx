import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { darkTheme, lightTheme, signageDarkTheme, signageLightTheme } from "@/styles/theme";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("mostra o texto de cada tom", () => {
    renderWithTheme(
      <>
        <StatusBadge tone="success">Ativo</StatusBadge>
        <StatusBadge tone="info">Info</StatusBadge>
        <StatusBadge tone="warn">Atenção</StatusBadge>
        <StatusBadge tone="neutral">Neutro</StatusBadge>
        <StatusBadge tone="danger">6 dias de atraso</StatusBadge>
      </>,
    );

    for (const texto of ["Ativo", "Info", "Atenção", "Neutro", "6 dias de atraso"]) {
      expect(screen.getByText(texto)).toBeInTheDocument();
    }
  });

  it("o tom danger usa o texto do tema, com o ponto como reforço visual", () => {
    renderWithTheme(<StatusBadge tone="danger">6 dias de atraso</StatusBadge>);

    const selo = screen.getByText("6 dias de atraso");
    const estilo = getComputedStyle(selo);
    expect(estilo.color).not.toBe("");
    // O ponto é um pseudo-elemento: não entra na árvore de acessibilidade nem no texto lido.
    expect(selo.textContent).toBe("6 dias de atraso");
  });

  it.each([
    ["claro", lightTheme],
    ["escuro", darkTheme],
    ["sinalização claro", signageLightTheme],
    ["sinalização escuro", signageDarkTheme],
  ])("o tema %s define o fundo suave do danger", (_nome, tema) => {
    expect(tema.colors.dangerSoft).toMatch(/^rgba\(/);
  });
});
