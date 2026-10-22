import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { InfoCard } from "./InfoCard";

describe("InfoCard", () => {
  it("mostra o título e o conteúdo em uma região de status", () => {
    renderWithTheme(<InfoCard title="Mensalista">Saída sem cobrança.</InfoCard>);
    expect(screen.getByRole("status")).toHaveTextContent("Mensalista");
    expect(screen.getByText("Saída sem cobrança.")).toBeInTheDocument();
  });

  it("funciona só com o título", () => {
    renderWithTheme(<InfoCard title="Mensalista" />);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
  });

  it("esconde o ícone dos leitores de tela", () => {
    renderWithTheme(<InfoCard title="Mensalista" icon={<svg data-testid="icone" />} />);
    expect(screen.getByTestId("icone").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});
