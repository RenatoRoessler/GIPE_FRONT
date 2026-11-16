import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ChangeDisplay } from "./ChangeDisplay";

describe("ChangeDisplay", () => {
  it("mostra o troco quando o cliente pagou a mais", () => {
    renderWithTheme(<ChangeDisplay recebido={250} valor={220} />);
    expect(screen.getByText("Troco")).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
    expect(screen.getByText("recebido R$ 250,00")).toBeInTheDocument();
  });

  it("diz 'Sem troco' no valor exato", () => {
    renderWithTheme(<ChangeDisplay recebido={220} valor={220} />);
    expect(screen.getByText("Sem troco")).toBeInTheDocument();
  });

  it("mostra quanto falta quando o valor é menor", () => {
    renderWithTheme(<ChangeDisplay recebido={200} valor={220} />);
    expect(screen.getByText("Faltam R$ 20,00")).toBeInTheDocument();
    expect(screen.queryByText("Troco")).not.toBeInTheDocument();
  });

  it("não mostra nada sem valor recebido, mas mantém a região viva", () => {
    const { container } = renderWithTheme(<ChangeDisplay recebido={null} valor={220} />);
    expect(screen.queryByText("Troco")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
