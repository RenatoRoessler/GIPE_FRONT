import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { DockBar } from "./DockBar";

describe("DockBar", () => {
  it("é uma região nomeada com o conteúdo recebido", () => {
    renderWithTheme(
      <DockBar aria-label="Simulador">
        <button type="button">Ajustar</button>
      </DockBar>,
    );
    const regiao = screen.getByRole("region", { name: "Simulador" });
    expect(regiao).toContainElement(screen.getByRole("button", { name: "Ajustar" }));
  });

  it("publica --dock-altura enquanto está montada e remove ao desmontar", () => {
    const { unmount } = renderWithTheme(
      <DockBar aria-label="Simulador">
        <span>Resultado</span>
      </DockBar>,
    );
    // Sem layout no jsdom, vale a altura do token (72px).
    expect(document.documentElement.style.getPropertyValue("--dock-altura")).toBe("72px");
    unmount();
    expect(document.documentElement.style.getPropertyValue("--dock-altura")).toBe("");
  });
});
