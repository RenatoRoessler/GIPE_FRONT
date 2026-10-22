import { describe, expect, it } from "vitest";
import { lightTheme, darkTheme, signageLightTheme, signageDarkTheme } from "@/styles/theme";
import { BOTTOM_NAV_ITEMS, isMenuTabActive, isNavAction, isNavActive, isNavItemActive, NAV_ITEMS, navItemKey } from "./nav";

describe("NAV_ITEMS", () => {
  it("o Pátio fica entre a saída de veículos e o caixa", () => {
    const rotulos = NAV_ITEMS.map((item) => item.label);

    expect(rotulos.indexOf("Pátio")).toBe(rotulos.indexOf("Saída de Veículos") + 1);
    expect(rotulos.indexOf("Caixa")).toBe(rotulos.indexOf("Pátio") + 1);
    expect(NAV_ITEMS.find((item) => item.label === "Pátio")).toEqual({ label: "Pátio", href: "/patio", icon: "yard" });
  });

  it("mantém os dez itens, na mesma ordem", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Início",
      "Gestão de Preços",
      "Gestão de Usuários",
      "Mensalistas",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Pátio",
      "Caixa",
      "Relatórios",
      "Minha Empresa",
    ]);
  });

  it("Entrada e Saída são ações (abrem modal); os outros oito são links", () => {
    const acoes = NAV_ITEMS.filter(isNavAction);
    expect(acoes.map((item) => [item.label, item.acao, item.icon])).toEqual([
      ["Entrada de Veículos", "entrada", "vehicleIn"],
      ["Saída de Veículos", "saida", "vehicleOut"],
    ]);
    expect(NAV_ITEMS.filter((item) => !isNavAction(item))).toHaveLength(8);
  });

  it("não repete chave nem ícone", () => {
    expect(new Set(NAV_ITEMS.map(navItemKey)).size).toBe(NAV_ITEMS.length);
    expect(new Set(NAV_ITEMS.map((item) => item.icon)).size).toBe(NAV_ITEMS.length);
  });

  it("nenhum item aponta para as páginas antigas de entrada e saída", () => {
    const enderecos = NAV_ITEMS.filter((item) => !isNavAction(item)).map((item) => (item as { href: string }).href);
    expect(enderecos).not.toContain("/veiculos/entrada");
    expect(enderecos).not.toContain("/veiculos/saida");
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

describe("isNavActive", () => {
  const patio = NAV_ITEMS.find((item) => item.label === "Pátio")!;
  const entrada = NAV_ITEMS.find((item) => item.label === "Entrada de Veículos")!;

  it("um link fica ativo na rota dele e nas filhas, não em rotas parecidas", () => {
    expect(isNavActive("/patio", patio)).toBe(true);
    expect(isNavActive("/patio/detalhe", patio)).toBe(true);
    expect(isNavActive("/patios", patio)).toBe(false);
  });

  it("uma ação nunca fica ativa, em nenhuma rota", () => {
    for (const rota of ["/dashboard", "/patio", "/veiculos/entrada", "/caixa"]) {
      expect(isNavActive(rota, entrada)).toBe(false);
    }
  });
});

describe("BOTTOM_NAV_ITEMS", () => {
  it("tem Início (link), Entrada e Saída (ações), nessa ordem, com rótulos curtos", () => {
    expect(BOTTOM_NAV_ITEMS.map((item) => item.label)).toEqual(["Início", "Entrada", "Saída"]);
    expect(BOTTOM_NAV_ITEMS.map(isNavAction)).toEqual([false, true, true]);
    expect(BOTTOM_NAV_ITEMS.map(navItemKey)).toEqual(["/dashboard", "entrada", "saida"]);
  });

  it("cada atalho existe em NAV_ITEMS, com a mesma chave e o mesmo ícone", () => {
    for (const atalho of BOTTOM_NAV_ITEMS) {
      const item = NAV_ITEMS.find((navItem) => navItemKey(navItem) === navItemKey(atalho));
      expect(item).toBeDefined();
      expect(atalho.icon).toBe(item?.icon);
    }
  });
});

describe("isMenuTabActive", () => {
  it.each(["/dashboard"])("é falso em %s, o Início", (rota) => {
    expect(isMenuTabActive(rota)).toBe(false);
  });

  it.each(["/caixa", "/patio", "/mensalistas", "/precos/novo", "/minha-empresa"])("é verdadeiro em %s, só alcançada pelo painel", (rota) => {
    expect(isMenuTabActive(rota)).toBe(true);
  });
});

describe("tema: layout", () => {
  it.each([
    ["claro", lightTheme],
    ["escuro", darkTheme],
    ["sinalização clara", signageLightTheme],
    ["sinalização escura", signageDarkTheme],
  ])("o tema %s tem a altura da barra inferior", (_nome, tema) => {
    expect(tema.layout.bottomNavHeight).toBe("64px");
  });
});
