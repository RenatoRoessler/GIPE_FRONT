import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { darkTheme, lightTheme } from "@/styles/theme";
import { TipoClienteBadge } from "./TipoClienteBadge";

describe("TipoClienteBadge", () => {
  it.each([
    ["avulso", "P", "Avulso"],
    ["mensal", "M", "Mensal"],
    ["conveniado", "C", "Conveniado"],
  ] as const)("%s mostra a inicial %s e o nome por extenso", (tipo, inicial, nome) => {
    renderWithTheme(<TipoClienteBadge tipo={tipo} />);
    const selo = screen.getByRole("img", { name: nome });
    expect(selo).toHaveAttribute("title", nome);
    expect(selo).toHaveTextContent(inicial);
  });

  it("usa a cor do tipo e a inicial em asfalto", () => {
    renderWithTheme(<TipoClienteBadge tipo="mensal" />);
    const estilo = getComputedStyle(screen.getByRole("img"));
    expect(estilo.backgroundColor).toBe(hexParaRgb(lightTheme.colors.cliente.mensal));
    expect(estilo.color).toBe(hexParaRgb(lightTheme.colors.onPrimary));
  });

  it("a inicial é asfalto nos dois temas (contraste sobre as cores de cliente)", () => {
    expect(lightTheme.colors.onPrimary).toBe(darkTheme.colors.onPrimary);
    expect(lightTheme.colors.cliente).toEqual(darkTheme.colors.cliente);
  });

  it("tem tamanhos sm e md", () => {
    renderWithTheme(
      <>
        <TipoClienteBadge tipo="avulso" size="sm" />
        <TipoClienteBadge tipo="mensal" size="md" />
      </>,
    );
    const [sm, md] = screen.getAllByRole("img");
    expect(getComputedStyle(sm).width).toBe("20px");
    expect(getComputedStyle(md).width).toBe("26px");
  });
});

function hexParaRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
