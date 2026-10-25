import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import { Button } from "./Button";

describe("Button", () => {
  it("a variante primary é o amarelo da marca, com texto em asfalto", () => {
    renderWithTheme(<Button variant="primary">Salvar</Button>);

    expect(screen.getByRole("button", { name: "Salvar" })).toHaveStyle({
      backgroundColor: lightTheme.colors.primary,
      color: lightTheme.colors.onPrimary,
    });
    expect(lightTheme.colors.primary).toBe("#FFC20E");
    expect(lightTheme.colors.onPrimary).toBe("#0E1729");
  });

  it("a variante secondary é só contorno, sem preenchimento amarelo", () => {
    renderWithTheme(<Button variant="secondary">Cancelar</Button>);

    const botao = screen.getByRole("button", { name: "Cancelar" });
    expect(botao).toHaveStyle({ color: lightTheme.colors.text });
    expect(botao).not.toHaveStyle({ backgroundColor: lightTheme.colors.primary });
  });

  it("a variante danger usa o texto próprio para ler sobre o vermelho", () => {
    renderWithTheme(<Button variant="danger">Excluir</Button>);

    expect(screen.getByRole("button", { name: "Excluir" })).toHaveStyle({
      backgroundColor: lightTheme.colors.danger,
      color: lightTheme.colors.onDanger,
    });
  });
});
