import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { renderWithTheme } from "@/test/render";
import { ActionBar } from "./ActionBar";

describe("ActionBar", () => {
  it("mostra a ação principal sozinha na primeira etapa", () => {
    renderWithTheme(<ActionBar principal={<Button>Próximo</Button>} />);
    expect(screen.getByRole("button", { name: "Próximo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
  });

  it("mostra Voltar antes da ação principal", () => {
    renderWithTheme(
      <ActionBar secundaria={<Button variant="secondary">Voltar</Button>} principal={<Button>Próximo</Button>} />,
    );
    const botoes = screen.getAllByRole("button");
    expect(botoes.map((botao) => botao.textContent)).toEqual(["Voltar", "Próximo"]);
  });

  it("respeita o botão principal desabilitado", () => {
    renderWithTheme(<ActionBar principal={<Button disabled>Criando conta…</Button>} />);
    expect(screen.getByRole("button", { name: "Criando conta…" })).toBeDisabled();
  });
});
