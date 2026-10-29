import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { AberturaCaixa } from "./AberturaCaixa";

describe("AberturaCaixa", () => {
  it("mostra a data e hora da abertura e o selo Aberto", () => {
    renderWithTheme(
      <AberturaCaixa caixa={{ caixaId: 1, dataHoraAbertura: "2026-10-29T07:00:00", valorFundoCaixa: 100, valorTotalEntrada: 0, valorTotalSaida: 0 }} />,
    );

    const cartao = screen.getByRole("region", { name: "Abertura do caixa" });
    expect(cartao).toHaveTextContent("29/10/2026");
    expect(cartao).toHaveTextContent("07:00");
    expect(screen.getByText("Aberto", { selector: "span" })).toBeInTheDocument();
  });
});
