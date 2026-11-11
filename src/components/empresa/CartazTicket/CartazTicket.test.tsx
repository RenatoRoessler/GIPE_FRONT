import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CartazTicket } from "./CartazTicket";

const LINK = "https://app.murel.com.br/ticket/3f2b8c1e-0000-4000-8000-000000000001";

// O cartaz fica oculto na tela (só aparece na impressão): por isso os papéis são buscados com `hidden`.
describe("CartazTicket", () => {
  it("é o nó de impressão do cartaz", () => {
    const { container } = renderWithTheme(<CartazTicket link={LINK} />);

    expect(container.querySelector("#cartaz-print-root")).toBeInTheDocument();
  });

  it("mostra o QR code com o link da consulta da empresa", () => {
    renderWithTheme(<CartazTicket link={LINK} />);

    const qr = screen.getByRole("img", { name: "QR code para consultar o ticket", hidden: true });
    expect(qr.tagName.toLowerCase()).toBe("svg");
  });

  it("traz o título, os três passos e os benefícios", () => {
    renderWithTheme(<CartazTicket link={LINK} />);

    expect(screen.getByRole("heading", { level: 1, hidden: true })).toHaveTextContent("Seu ticket está no celular.");
    expect(screen.getByRole("heading", { name: "Aponte a câmera", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Digite a placa", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pronto, acompanhe", hidden: true })).toBeInTheDocument();
    expect(screen.getByText("Sem baixar app")).toBeInTheDocument();
    expect(screen.getByText("Sem cadastro")).toBeInTheDocument();
    expect(screen.getByText("Sem papel")).toBeInTheDocument();
    expect(screen.getByText("Dúvidas? Fale com o operador.")).toBeInTheDocument();
    expect(screen.getByText("murel.com.br")).toBeInTheDocument();
  });

  it("mostra a placa de exemplo e não deixa o texto do espaço reservado da referência", () => {
    renderWithTheme(<CartazTicket link={LINK} />);

    expect(screen.getByText("MUR3L26")).toBeInTheDocument();
    expect(screen.queryByText(/Cole aqui/i)).not.toBeInTheDocument();
  });
});
