import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { AvisoVencimento } from "../vencimento";
import { VencimentoAviso } from "./VencimentoAviso";

function renderizar(aviso: AvisoVencimento) {
  return renderWithTheme(<VencimentoAviso aviso={aviso} />);
}

describe("VencimentoAviso", () => {
  it("vencida mostra o texto com ícone de alerta", () => {
    renderizar({ tipo: "vencida", texto: "Vencida há 3 dias" });
    expect(screen.getByText("Vencida há 3 dias")).toBeInTheDocument();
    expect(screen.getByTestId("icone-alerta")).toHaveAttribute("aria-hidden", "true");
  });

  it("vence hoje mostra o texto com ícone de alerta", () => {
    renderizar({ tipo: "hoje", texto: "Vence hoje" });
    expect(screen.getByText("Vence hoje")).toBeInTheDocument();
    expect(screen.getByTestId("icone-alerta")).toBeInTheDocument();
  });

  it("perto de vencer mostra o texto com ícone de relógio", () => {
    renderizar({ tipo: "proxima", texto: "Vence em 2 dias · 10/11" });
    expect(screen.getByText("Vence em 2 dias · 10/11")).toBeInTheDocument();
    expect(screen.getByTestId("icone-relogio")).toBeInTheDocument();
    expect(screen.queryByTestId("icone-alerta")).not.toBeInTheDocument();
  });

  it("vencimento distante mostra só o texto", () => {
    renderizar({ tipo: "futura", texto: "Vence em 10/12/2026" });
    expect(screen.getByText("Vence em 10/12/2026")).toBeInTheDocument();
    expect(screen.queryByTestId("icone-alerta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icone-relogio")).not.toBeInTheDocument();
  });
});
