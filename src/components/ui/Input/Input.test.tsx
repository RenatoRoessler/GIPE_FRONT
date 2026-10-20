import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Input } from "./Input";

describe("Input", () => {
  it("renderiza só o campo quando não há ação à direita", () => {
    renderWithTheme(<Input label="Placa" />);
    expect(screen.getByLabelText("Placa")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("mostra a ação à direita do campo", () => {
    renderWithTheme(<Input label="Placa" endAction={<button type="button">Ler</button>} />);
    expect(screen.getByLabelText("Placa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ler" })).toBeInTheDocument();
  });

  it("mantém o botão de senha e ignora a ação em campos de senha", () => {
    renderWithTheme(<Input label="Senha" type="password" endAction={<button type="button">Ler</button>} />);
    expect(screen.getByRole("button", { name: /mostrar senha/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ler" })).not.toBeInTheDocument();
  });
});
