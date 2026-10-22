import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PasswordRequirements } from "./PasswordRequirements";

describe("PasswordRequirements", () => {
  it("sem regras próprias usa as do cadastro", () => {
    renderWithTheme(<PasswordRequirements value="" />);
    expect(screen.getByText("Pelo menos 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Um símbolo (ex.: @, #, !)")).toBeInTheDocument();
  });

  it("com regras próprias mostra só elas", () => {
    renderWithTheme(
      <PasswordRequirements value="abc" rules={[{ id: "r", label: "Três letras", test: (v) => v.length >= 3 }]} />,
    );
    expect(screen.getByText("Três letras").closest("li")).toHaveTextContent("(cumprida)");
    expect(screen.queryByText("Pelo menos 8 caracteres")).not.toBeInTheDocument();
  });
});
