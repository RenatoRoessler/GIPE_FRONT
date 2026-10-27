import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { KeyBoardGrid, type KeyBoardLinha } from "./KeyBoardGrid";

const linhas: KeyBoardLinha[] = [
  {
    rotulo: "A",
    ganchos: [
      { id: 1, coluna: 1, estado: "ocupado", rotulo: "A1", legenda: "BRA2E19" },
      { id: 2, coluna: 2, estado: "selecionado", rotulo: "A2" },
      { id: 3, coluna: 3, estado: "livre", rotulo: "A3" },
    ],
  },
  {
    rotulo: "B",
    // B2 não existe no quadro: aparece como fora de uso.
    ganchos: [
      { id: 4, coluna: 1, estado: "livre", rotulo: "B1" },
      { id: 6, coluna: 3, estado: "livre", rotulo: "B3" },
    ],
  },
];

describe("KeyBoardGrid", () => {
  it("renderiza cabeçalhos, estados e a coluna que falta como fora de uso", () => {
    renderWithTheme(<KeyBoardGrid linhas={linhas} modo="escolher" aria-label="Quadro Recepção" />);
    expect(screen.getByRole("grid", { name: "Quadro Recepção" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((c) => c.textContent)).toEqual(["1", "2", "3"]);
    expect(screen.getByRole("img", { name: "A1, ocupado, BRA2E19" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A2, selecionado" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "A3, livre" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("img", { name: "B2, fora de uso" })).toBeInTheDocument();
  });

  it("no modo escolher seleciona só ganchos livres", async () => {
    const onSelect = vi.fn();
    renderWithTheme(<KeyBoardGrid linhas={linhas} modo="escolher" onSelect={onSelect} aria-label="Quadro" />);
    await userEvent.click(screen.getByRole("button", { name: "A3, livre" }));
    expect(onSelect).toHaveBeenCalledWith(3);
    expect(screen.queryByRole("button", { name: /A1/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /B2/ })).not.toBeInTheDocument();
  });

  it("no modo configurar alterna fora de uso e livre", async () => {
    const onToggle = vi.fn();
    const config: KeyBoardLinha[] = [
      {
        rotulo: "A",
        ganchos: [
          { id: "A1", coluna: 1, estado: "livre", rotulo: "A1" },
          { id: "A2", coluna: 2, estado: "fora", rotulo: "A2" },
          { id: "A3", coluna: 3, estado: "livre", rotulo: "A3", bloqueado: true },
        ],
      },
    ];
    renderWithTheme(<KeyBoardGrid linhas={config} modo="configurar" onToggle={onToggle} aria-label="Prévia" />);
    await userEvent.click(screen.getByRole("button", { name: "A1, em uso" }));
    await userEvent.click(screen.getByRole("button", { name: "A2, fora de uso" }));
    expect(onToggle.mock.calls.map(([id]) => id)).toEqual(["A1", "A2"]);
    expect(screen.getByRole("img", { name: "A3, já cadastrado" })).toBeInTheDocument();
  });

  it("só um gancho entra na ordem de Tab e as setas pulam os indisponíveis", async () => {
    renderWithTheme(<KeyBoardGrid linhas={linhas} modo="escolher" onSelect={vi.fn()} aria-label="Quadro" />);
    const botoes = screen.getAllByRole("button");
    expect(botoes.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    // O selecionado é a parada inicial.
    const a2 = screen.getByRole("button", { name: "A2, selecionado" });
    expect(a2.tabIndex).toBe(0);
    a2.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "A3, livre" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "B3, livre" })).toHaveFocus();
    // B2 não existe: a seta para a esquerda pula para B1.
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "B1, livre" })).toHaveFocus();
  });
});
