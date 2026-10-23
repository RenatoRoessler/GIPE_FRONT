import { describe, expect, it } from "vitest";
import { lightTheme, darkTheme, signageLightTheme, signageDarkTheme } from "@/styles/theme";
import { BOTTOM_NAV_ITEMS, bottomNavItemsPermitidos, isMenuTabActive, isNavAction, isNavActive, isNavItemActive, NAV_ITEMS, navItemKey, navItemsPermitidos } from "./nav";

describe("NAV_ITEMS", () => {
  it("o Pátio fica entre a saída de veículos e o caixa", () => {
    const rotulos = NAV_ITEMS.map((item) => item.label);

    expect(rotulos.indexOf("Pátio")).toBe(rotulos.indexOf("Saída de Veículos") + 1);
    expect(rotulos.indexOf("Caixa")).toBe(rotulos.indexOf("Pátio") + 1);
    expect(NAV_ITEMS.find((item) => item.label === "Pátio")).toEqual({ label: "Pátio", href: "/patio", icon: "yard", area: "patio" });
  });

  it("mantém os onze itens, na mesma ordem, com Notas Fiscais depois do Caixa", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Início",
      "Gestão de Preços",
      "Gestão de Usuários",
      "Mensalistas",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Pátio",
      "Caixa",
      "Notas Fiscais",
      "Relatórios",
      "Minha Empresa",
    ]);
  });

  it("Entrada e Saída são ações (abrem modal); os outros nove são links", () => {
    const acoes = NAV_ITEMS.filter(isNavAction);
    expect(acoes.map((item) => [item.label, item.acao, item.icon])).toEqual([
      ["Entrada de Veículos", "entrada", "vehicleIn"],
      ["Saída de Veículos", "saida", "vehicleOut"],
    ]);
    expect(NAV_ITEMS.filter((item) => !isNavAction(item))).toHaveLength(9);
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

  it.each(["/caixa", "/patio", "/mensalistas", "/precos/novo", "/minha-empresa", "/notas-fiscais"])("é verdadeiro em %s, só alcançada pelo painel", (rota) => {
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

describe("Notas Fiscais no menu", () => {
  const item = NAV_ITEMS.find((navItem) => navItem.label === "Notas Fiscais")!;

  it("é um link para /notas-fiscais, com ícone próprio", () => {
    expect(item).toEqual({ label: "Notas Fiscais", href: "/notas-fiscais", icon: "invoice", area: "notas-fiscais" });
  });

  it("fica ativo em /notas-fiscais e nas rotas filhas, não em rotas parecidas", () => {
    expect(isNavActive("/notas-fiscais", item)).toBe(true);
    expect(isNavActive("/notas-fiscais?aba=lancadas", item)).toBe(false);
    expect(isNavActive("/notas-fiscais/x", item)).toBe(true);
    expect(isNavActive("/notas", item)).toBe(false);
  });

  it("não entra na barra inferior, que continua com os três atalhos", () => {
    expect(BOTTOM_NAV_ITEMS.map((atalho) => atalho.label)).toEqual(["Início", "Entrada", "Saída"]);
  });
});

describe("navItemsPermitidos", () => {
  const rotulos = (perfil: Parameters<typeof navItemsPermitidos>[0]) => navItemsPermitidos(perfil).map((item) => item.label);

  it("o Administrador vê tudo", () => {
    expect(navItemsPermitidos(1)).toEqual(NAV_ITEMS);
    expect(rotulos(1)).toHaveLength(NAV_ITEMS.length);
  });

  it("o Gerente não vê usuários nem a empresa", () => {
    expect(rotulos(2)).toEqual([
      "Início",
      "Gestão de Preços",
      "Mensalistas",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Pátio",
      "Caixa",
      "Notas Fiscais",
      "Relatórios",
    ]);
  });

  it("o Caixa e o Manobrista só veem o dia a dia do pátio e do caixa", () => {
    const esperado = ["Início", "Entrada de Veículos", "Saída de Veículos", "Pátio", "Caixa"];
    expect(rotulos(4)).toEqual(esperado);
    expect(rotulos(3)).toEqual(esperado);
  });

  it("o Financeiro vê o início e as notas fiscais", () => {
    expect(rotulos(8)).toEqual(["Início", "Notas Fiscais"]);
  });

  it("o Administrador da conveniada vê o início e a gestão de usuários", () => {
    expect(rotulos(5)).toEqual(["Início", "Gestão de Usuários"]);
  });

  it("sem perfil conhecido só o Início", () => {
    expect(rotulos(null)).toEqual(["Início"]);
    expect(rotulos(undefined)).toEqual(["Início"]);
  });
});

describe("bottomNavItemsPermitidos", () => {
  const rotulos = (perfil: Parameters<typeof bottomNavItemsPermitidos>[0]) => bottomNavItemsPermitidos(perfil).map((item) => item.label);

  it("quem opera o pátio mantém os três atalhos", () => {
    for (const perfil of [1, 2, 3, 4] as const) {
      expect(rotulos(perfil)).toEqual(["Início", "Entrada", "Saída"]);
    }
  });

  it("quem não opera o pátio fica só com o Início", () => {
    for (const perfil of [8, 5, 6, 7, null] as const) {
      expect(rotulos(perfil)).toEqual(["Início"]);
    }
  });
});
