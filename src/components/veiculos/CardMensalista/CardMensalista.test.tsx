import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CardMensalista } from "./CardMensalista";

describe("CardMensalista", () => {
  it("mostra o título e o nome do mensalista", () => {
    renderWithTheme(<CardMensalista contexto="entrada" nome="Maria" />);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
  });

  it("sem nome, mostra só o título e o texto de apoio", () => {
    renderWithTheme(<CardMensalista contexto="entrada" />);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
    expect(screen.getByText("A entrada será registrada como mensalista.")).toBeInTheDocument();
  });

  it("muda o texto de apoio entre entrada e saída", () => {
    const { unmount } = renderWithTheme(<CardMensalista contexto="entrada" nome="Maria" />);
    expect(screen.getByText("A entrada será registrada como mensalista.")).toBeInTheDocument();
    unmount();
    renderWithTheme(<CardMensalista contexto="saida" nome="Maria" />);
    expect(screen.getByText("Saída sem cobrança.")).toBeInTheDocument();
  });

  it("variante rotativo avisa que a entrada será cobrada e mostra o horário contratado", () => {
    renderWithTheme(<CardMensalista contexto="entrada" variante="rotativo" nome="Maria" horario={{ de: "07:00", ate: "19:00" }} />);
    expect(screen.getByText("Mensalista fora do horário")).toBeInTheDocument();
    expect(screen.getByText("A entrada será registrada como rotativo e cobrada normalmente.")).toBeInTheDocument();
    expect(screen.getByText("Horário contratado: 07:00 às 19:00.")).toBeInTheDocument();
  });

  it("variante rotativo sem horário omite a linha do horário", () => {
    renderWithTheme(<CardMensalista contexto="entrada" variante="rotativo" />);
    expect(screen.queryByText(/Horário contratado/)).not.toBeInTheDocument();
  });
});
