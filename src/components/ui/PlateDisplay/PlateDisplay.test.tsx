import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PlateDisplay } from "./PlateDisplay";

describe("PlateDisplay", () => {
  it("mostra a placa Mercosul sem hífen", () => {
    renderWithTheme(<PlateDisplay value="ABC1D23" />);
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("BRASIL")).toBeInTheDocument();
  });

  it("aplica o hífen no padrão antigo", () => {
    const { container } = renderWithTheme(<PlateDisplay value="ABC1234" />);
    expect(screen.getByText("ABC-1234")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("data-variant", "antiga");
  });

  it("respeita a variante informada e o rótulo da faixa", () => {
    renderWithTheme(<PlateDisplay value="ABC1D23" variant="antiga" bandLabel="PR" />);
    expect(screen.getByText("PR")).toBeInTheDocument();
  });

  it("renderiza os filhos no lugar do texto", () => {
    renderWithTheme(
      <PlateDisplay value="" size="lg">
        <input aria-label="Placa" />
      </PlateDisplay>,
    );
    expect(screen.getByLabelText("Placa")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });
});
