import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PlateKeyboard } from "./PlateKeyboard";

function renderizar(valor: string) {
  const onChar = vi.fn();
  const onApagar = vi.fn();
  renderWithTheme(<PlateKeyboard valor={valor} onChar={onChar} onApagar={onApagar} />);
  return { onChar, onApagar };
}

const tecla = (nome: string) => screen.getByRole("button", { name: nome });
const temTecla = (nome: string) => screen.queryByRole("button", { name: nome }) !== null;

describe("PlateKeyboard", () => {
  it.each(["", "A", "AB"])("mostra o QWERTY nas posições 1 a 3 (valor %j)", (valor) => {
    renderizar(valor);

    expect(temTecla("Q")).toBe(true);
    expect(temTecla("1")).toBe(false);
    expect(tecla("Apagar")).toBeEnabled();
  });

  it("mostra o bloco numérico na 4ª posição", () => {
    const { onChar } = renderizar("ABC");

    expect(temTecla("Q")).toBe(false);
    fireEvent.click(tecla("7"));
    expect(onChar).toHaveBeenCalledWith("7");
  });

  it("na 5ª posição mostra números e letras (Mercosul ou antiga)", () => {
    const { onChar } = renderizar("ABC1");

    expect(temTecla("D")).toBe(true);
    expect(temTecla("2")).toBe(true);
    fireEvent.click(tecla("D"));
    expect(onChar).toHaveBeenCalledWith("D");
  });

  it("Mercosul (ABC1D) pede números nas posições 6 e 7", () => {
    renderizar("ABC1D");

    expect(temTecla("Q")).toBe(false);
    expect(tecla("5")).toBeEnabled();
  });

  it("padrão antigo (ABC12) pede números nas posições 6 e 7", () => {
    renderizar("ABC12");

    expect(temTecla("Q")).toBe(false);
    expect(tecla("5")).toBeEnabled();
  });

  it("com a placa completa desabilita as teclas de caractere e mantém o apagar", () => {
    const { onApagar } = renderizar("ABC1D23");

    expect(tecla("5")).toBeDisabled();
    expect(tecla("Apagar")).toBeEnabled();
    fireEvent.click(tecla("Apagar"));
    expect(onApagar).toHaveBeenCalledTimes(1);
  });

  it("não tem tecla de ação", () => {
    renderizar("ABC");

    expect(temTecla("Próximo campo")).toBe(false);
    expect(temTecla("Concluir")).toBe(false);
  });

  it("é um grupo com o nome Teclado de placa", () => {
    renderizar("");

    expect(screen.getByRole("group", { name: "Teclado de placa" })).toBeInTheDocument();
  });
});
