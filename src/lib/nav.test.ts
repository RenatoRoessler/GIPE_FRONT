import { describe, expect, it } from "vitest";
import { isNavItemActive, NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("o Pátio fica entre a saída de veículos e o caixa", () => {
    const rotulos = NAV_ITEMS.map((item) => item.label);

    expect(rotulos.indexOf("Pátio")).toBe(rotulos.indexOf("Saída de Veículos") + 1);
    expect(rotulos.indexOf("Caixa")).toBe(rotulos.indexOf("Pátio") + 1);
    expect(NAV_ITEMS.find((item) => item.label === "Pátio")).toEqual({ label: "Pátio", href: "/patio", icon: "yard" });
  });

  it("não repete endereço nem ícone", () => {
    expect(new Set(NAV_ITEMS.map((item) => item.href)).size).toBe(NAV_ITEMS.length);
    expect(new Set(NAV_ITEMS.map((item) => item.icon)).size).toBe(NAV_ITEMS.length);
  });
});

describe("isNavItemActive", () => {
  it("o Pátio fica ativo em /patio e nas rotas filhas, não em rotas parecidas", () => {
    expect(isNavItemActive("/patio", "/patio")).toBe(true);
    expect(isNavItemActive("/patio/detalhe", "/patio")).toBe(true);
    expect(isNavItemActive("/patios", "/patio")).toBe(false);
    expect(isNavItemActive("/veiculos/saida", "/patio")).toBe(false);
  });
});
