import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/lib/nav";
import { NavIcon } from "./NavIcons";

describe("NavIcon", () => {
  it("desenha o ícone do catálogo de serviços, diferente do da fila", () => {
    const catalogo = render(<NavIcon id="catalog" data-testid="catalogo" />).getByTestId("catalogo");
    const fila = render(<NavIcon id="services" data-testid="fila" />).getByTestId("fila");

    expect(catalogo.tagName.toLowerCase()).toBe("svg");
    expect(catalogo.innerHTML).not.toBe(fila.innerHTML);
    expect(catalogo.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("todo item do menu tem um ícone que renderiza", () => {
    for (const item of NAV_ITEMS) {
      const { container, unmount } = render(<NavIcon id={item.icon} />);
      expect(container.querySelector("svg")).not.toBeNull();
      unmount();
    }
  });
});
