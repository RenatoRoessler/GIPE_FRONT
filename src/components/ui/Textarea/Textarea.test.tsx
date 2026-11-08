import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import { Textarea } from "./Textarea";

function Controlado({ inicial = "", limite, error }: { inicial?: string; limite?: number; error?: string }) {
  const [valor, setValor] = useState(inicial);
  return <Textarea label="Observação" value={valor} onChange={(evento) => setValor(evento.target.value)} limite={limite} error={error} />;
}

describe("Textarea", () => {
  it("liga o rótulo ao campo de várias linhas", () => {
    renderWithTheme(<Controlado />);

    const campo = screen.getByLabelText("Observação");
    expect(campo.tagName).toBe("TEXTAREA");
    expect(campo).not.toHaveAttribute("aria-invalid", "true");
  });

  it("digitar atualiza o valor e o contador", async () => {
    renderWithTheme(<Controlado limite={500} />);

    expect(screen.getByText("0 / 500")).toBeInTheDocument();
    await userEvent.setup().type(screen.getByLabelText("Observação"), "teste");
    expect(screen.getByText("5 / 500")).toBeInTheDocument();
  });

  it("sem limite não mostra contador", () => {
    renderWithTheme(<Controlado />);

    expect(screen.queryByText(/\/ /)).not.toBeInTheDocument();
  });

  it("passar do limite marca o campo como inválido e o contador em cor de erro, sem cortar o texto", () => {
    renderWithTheme(<Controlado inicial="abcdef" limite={5} />);

    const campo = screen.getByLabelText("Observação");
    expect(campo).toHaveValue("abcdef");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("6 / 5")).toHaveStyle({ color: lightTheme.colors.danger });
  });

  it("mostra o erro ligado ao campo", () => {
    renderWithTheme(<Controlado error="Máximo de 500 caracteres." limite={500} />);

    const campo = screen.getByLabelText("Observação");
    expect(screen.getByText("Máximo de 500 caracteres.")).toBeInTheDocument();
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo.getAttribute("aria-describedby")).toContain("-error");
  });
});
