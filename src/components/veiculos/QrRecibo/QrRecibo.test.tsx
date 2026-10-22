import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { QrRecibo } from "./QrRecibo";

describe("QrRecibo", () => {
  it("mostra o QR, os textos de apoio e o endereço curto, sem https://", () => {
    renderWithTheme(<QrRecibo link="https://gipe.exemplo.com/recibo/ABCD1234EF" />);

    expect(screen.getByRole("img", { name: "QR code do recibo de saída" })).toBeInTheDocument();
    expect(screen.getByText("Leve o recibo no celular")).toBeInTheDocument();
    expect(screen.getByText("Escaneie o código para abrir ou baixar")).toBeInTheDocument();
    expect(screen.getByText("gipe.exemplo.com/recibo/ABCD1234EF")).toBeInTheDocument();
  });

  it("aceita endereço http (ambiente local)", () => {
    renderWithTheme(<QrRecibo link="http://localhost:3000/recibo/ABCD1234EF" />);
    expect(screen.getByText("localhost:3000/recibo/ABCD1234EF")).toBeInTheDocument();
  });

  it.each([null, undefined, ""])("sem link (%s) não renderiza nada, nem espaço vazio", (link) => {
    const { container } = renderWithTheme(<QrRecibo link={link} />);
    expect(container).toBeEmptyDOMElement();
  });
});
