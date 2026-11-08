import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Select } from "./Select";

describe("Select", () => {
  it("liga o rótulo ao campo", () => {
    renderWithTheme(
      <Select label="Conveniada">
        <option value="">Todas</option>
      </Select>,
    );
    expect(screen.getByLabelText("Conveniada")).toBeInTheDocument();
  });

  it("com hideLabel o rótulo continua ligado ao campo, só escondido de quem vê", () => {
    renderWithTheme(
      <Select label="Conveniada" hideLabel>
        <option value="">Todas as conveniadas</option>
      </Select>,
    );
    expect(screen.getByLabelText("Conveniada")).toBeInTheDocument();
    expect(screen.getByText("Conveniada")).toHaveStyle({ width: "1px", height: "1px" });
  });

  it("sem hideLabel o rótulo não é recortado", () => {
    renderWithTheme(
      <Select label="Conveniada">
        <option value="">Todas</option>
      </Select>,
    );
    expect(screen.getByText("Conveniada")).not.toHaveStyle({ width: "1px" });
  });
});
