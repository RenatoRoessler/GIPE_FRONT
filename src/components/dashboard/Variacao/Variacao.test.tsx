import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import { Variacao } from "./Variacao";

describe("Variacao", () => {
  it("queda: seta para baixo, módulo do percentual e o que foi comparado", () => {
    const { container } = renderWithTheme(<Variacao valor={-100} texto="vs. quinta passada" />);

    expect(container.firstElementChild).toHaveAttribute("data-sentido", "queda");
    expect(container).toHaveTextContent("▼");
    expect(container).toHaveTextContent("100%");
    expect(container).toHaveTextContent("vs. quinta passada");
    expect(container.firstElementChild).toHaveStyle({ color: lightTheme.colors.danger });
  });

  it("alta: seta para cima na cor de sucesso", () => {
    const { container } = renderWithTheme(<Variacao valor={14.01} texto="vs. setembro" />);

    expect(container.firstElementChild).toHaveAttribute("data-sentido", "alta");
    expect(container).toHaveTextContent("▲");
    expect(container).toHaveTextContent("14%");
    expect(container.firstElementChild).toHaveStyle({ color: lightTheme.colors.success });
  });

  it("zero conta como alta", () => {
    const { container } = renderWithTheme(<Variacao valor={0} />);

    expect(container.firstElementChild).toHaveAttribute("data-sentido", "alta");
    expect(container).toHaveTextContent("0%");
  });

  it("a cor não fala sozinha: o sentido também está em texto para leitor de tela e a seta fica escondida dele", () => {
    const { container } = renderWithTheme(<Variacao valor={-30} texto="vs. out até dia 19" />);

    expect(screen.getByText("Queda de")).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toHaveTextContent("▼");
    expect(container.firstElementChild).toHaveTextContent("Queda de 30% vs. out até dia 19");
  });

  it("alta fala 'Alta de'", () => {
    renderWithTheme(<Variacao valor={5} />);

    expect(screen.getByText("Alta de")).toBeInTheDocument();
  });

  it("a pílula tem fundo suave e o texto simples não tem", () => {
    const { container, rerender } = renderWithTheme(<Variacao valor={-5} />);

    expect(container.firstElementChild).toHaveStyle({ backgroundColor: lightTheme.colors.dangerSoft });

    rerender(<Variacao valor={-5} pilula={false} />);
    expect(container.firstElementChild).not.toHaveStyle({ backgroundColor: lightTheme.colors.dangerSoft });
  });

  it("sem texto de comparação mostra só a variação", () => {
    const { container } = renderWithTheme(<Variacao valor={12} />);

    expect(container).toHaveTextContent("12%");
    expect(container).not.toHaveTextContent("vs.");
  });
});
