import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ContratoMensagem } from "./ContratoMensagem";

vi.mock("@/components/ui/Logo", () => ({ Logo: () => <div data-testid="logo" /> }));

describe("ContratoMensagem", () => {
  it("link vencido explica o prazo e o que fazer", () => {
    renderWithTheme(<ContratoMensagem kind="vencido" />);
    expect(screen.getByRole("heading", { level: 1, name: "Este link venceu" })).toBeInTheDocument();
    expect(
      screen.getByText("Os links do contrato valem 7 dias. Peça um novo link ao estacionamento."),
    ).toBeInTheDocument();
  });

  it("link inválido não mostra detalhe técnico", () => {
    renderWithTheme(<ContratoMensagem kind="invalido" />);
    expect(screen.getByRole("heading", { level: 1, name: "Link inválido" })).toBeInTheDocument();
    expect(
      screen.getByText("Confira se abriu o link completo do e-mail ou peça um novo ao estacionamento."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/token|erro|400|404/i)).not.toBeInTheDocument();
  });
});
