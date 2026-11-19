import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { lightTheme } from "@/styles/theme";
import { PainelDashboard } from "./PainelDashboard";

describe("PainelDashboard", () => {
  it("é uma região nomeada pelo rótulo, que é um título da página", () => {
    renderWithTheme(
      <PainelDashboard titulo="De onde vem o dinheiro">
        <p>conteúdo</p>
      </PainelDashboard>,
    );

    const regiao = screen.getByRole("region", { name: "De onde vem o dinheiro" });
    expect(regiao).toHaveTextContent("conteúdo");
    expect(screen.getByRole("heading", { level: 2, name: "De onde vem o dinheiro" })).toBeInTheDocument();
  });

  it("mostra o acessório ao lado do rótulo", () => {
    renderWithTheme(<PainelDashboard titulo="Faturamento" acessorio={<span>Fechado</span>} />);

    expect(screen.getByText("Fechado")).toBeInTheDocument();
  });

  it("o acessório vai ao fim por padrão e logo depois do rótulo quando pedido", () => {
    const { rerender } = renderWithTheme(<PainelDashboard titulo="Gráfico" acessorio={<span>legenda</span>} />);
    const cabecalho = () => screen.getByRole("heading", { name: "Gráfico" }).parentElement;

    expect(cabecalho()).toHaveStyle({ justifyContent: "space-between" });

    rerender(<PainelDashboard titulo="Gráfico" acessorio={<span>legenda</span>} posicaoAcessorio="inicio" />);
    expect(cabecalho()).toHaveStyle({ justifyContent: "flex-start" });
  });

  it("usa a superfície e a borda do tema, e repassa atributos como o data-testid", () => {
    renderWithTheme(<PainelDashboard titulo="Painel" data-testid="painel" />);

    expect(screen.getByTestId("painel")).toHaveStyle({ backgroundColor: lightTheme.colors.surface });
  });

  it("dois painéis têm nomes independentes", () => {
    renderWithTheme(
      <>
        <PainelDashboard titulo="Um" />
        <PainelDashboard titulo="Dois" />
      </>,
    );

    expect(screen.getByRole("region", { name: "Um" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Dois" })).toBeInTheDocument();
  });
});
