import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PlanosCarregando } from "./PlanosCarregando";

describe("PlanosCarregando", () => {
  it("anuncia o carregamento como status, com texto acessível", () => {
    renderWithTheme(<PlanosCarregando />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Carregando planos…");
  });

  it("reserva o espaço de dois cartões", () => {
    const { container } = renderWithTheme(<PlanosCarregando />);
    // Dois cartões, cada um com três blocos decorativos.
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(6);
  });

  it("não tem nenhum controle nem preço", () => {
    renderWithTheme(<PlanosCarregando />);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("R$");
  });
});
