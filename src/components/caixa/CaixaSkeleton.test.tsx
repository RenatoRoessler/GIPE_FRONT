import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CaixaSkeleton } from "./CaixaSkeleton";

describe("CaixaSkeleton", () => {
  it("anuncia o carregamento do caixa", () => {
    renderWithTheme(<CaixaSkeleton />);

    const estado = screen.getByRole("status");
    expect(estado).toHaveAttribute("aria-busy", "true");
    expect(estado).toHaveTextContent("Carregando caixa…");
  });
});
