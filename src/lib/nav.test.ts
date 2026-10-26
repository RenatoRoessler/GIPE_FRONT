import { describe, expect, it } from "vitest";
import { lightTheme, darkTheme } from "@/styles/theme";
import { dividirItensDaBarra, isMaisAtivo, isNavAction, isNavActive, isNavItemActive, NAV_ITEMS, navItemKey, navItemsPermitidos, navItemsPorPrioridade, ordenarPeloMenu } from "./nav";

describe("NAV_ITEMS", () => {
  it("o Pátio fica entre a saída de veículos e o caixa", () => {
    const rotulos = NAV_ITEMS.map((item) => item.label);

    expect(rotulos.indexOf("Pátio")).toBe(rotulos.indexOf("Saída de Veículos") + 1);
    expect(rotulos.indexOf("Caixa")).toBe(rotulos.indexOf("Pátio") + 1);
    expect(NAV_ITEMS.find((item) => item.label === "Pátio")).toEqual({ label: "Pátio", shortLabel: "Pátio", href: "/patio", icon: "yard", area: "patio" });
  });

  it("mantém os onze itens, com Entrada, Saída, Pátio e Caixa logo depois do Início", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Início",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Pátio",
      "Caixa",
      "Gestão de Preços",
      "Gestão de Usuários",
      "Mensalistas",
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

describe("tema: layout", () => {
  it.each([
    ["claro", lightTheme],
    ["escuro", darkTheme],
  ])("o tema %s tem a altura da barra inferior", (_nome, tema) => {
    expect(tema.layout.bottomNavHeight).toBe("64px");
  });
});

describe("Notas Fiscais no menu", () => {
  const item = NAV_ITEMS.find((navItem) => navItem.label === "Notas Fiscais")!;

  it("é um link para /notas-fiscais, com ícone próprio", () => {
    expect(item).toEqual({ label: "Notas Fiscais", shortLabel: "Notas", href: "/notas-fiscais", icon: "invoice", area: "notas-fiscais" });
  });

  it("fica ativo em /notas-fiscais e nas rotas filhas, não em rotas parecidas", () => {
    expect(isNavActive("/notas-fiscais", item)).toBe(true);
    expect(isNavActive("/notas-fiscais?aba=lancadas", item)).toBe(false);
    expect(isNavActive("/notas-fiscais/x", item)).toBe(true);
    expect(isNavActive("/notas", item)).toBe(false);
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
      "Entrada de Veículos",
      "Saída de Veículos",
      "Pátio",
      "Caixa",
      "Gestão de Preços",
      "Mensalistas",
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

describe("rótulos curtos", () => {
  it("todo item tem um rótulo curto, não vazio e com até 11 caracteres", () => {
    for (const item of NAV_ITEMS) {
      expect(item.shortLabel.trim()).not.toBe("");
      expect(item.shortLabel.length).toBeLessThanOrEqual(11);
    }
  });

  it("Entrada e Saída usam o mesmo rótulo curto da barra atual", () => {
    expect(NAV_ITEMS.filter(isNavAction).map((item) => item.shortLabel)).toEqual(["Entrada", "Saída"]);
  });
});

describe("navItemsPorPrioridade", () => {
  const rotulos = (perfil: Parameters<typeof navItemsPorPrioridade>[0]) => navItemsPorPrioridade(perfil).map((item) => item.shortLabel);

  it("Início, Entrada e Saída vêm primeiro e o resto segue a ordem do menu", () => {
    expect(rotulos(1)).toEqual(["Início", "Entrada", "Saída", "Pátio", "Caixa", "Preços", "Usuários", "Mensalistas", "Notas", "Relatórios", "Empresa"]);
  });

  it("só traz o que o perfil pode abrir", () => {
    expect(rotulos(4)).toEqual(["Início", "Entrada", "Saída", "Pátio", "Caixa"]);
    expect(rotulos(8)).toEqual(["Início", "Notas"]);
    expect(rotulos(null)).toEqual(["Início"]);
  });

  it("tem os mesmos itens do menu, só em outra ordem", () => {
    expect(navItemsPorPrioridade(1)).toHaveLength(NAV_ITEMS.length);
    expect(new Set(navItemsPorPrioridade(1).map(navItemKey))).toEqual(new Set(NAV_ITEMS.map(navItemKey)));
  });

  it("devolve a mesma ordem a cada chamada", () => {
    expect(rotulos(1)).toEqual(rotulos(1));
  });
});

describe("dividirItensDaBarra", () => {
  const itens = navItemsPorPrioridade(1);
  const rotulos = (lista: typeof itens) => lista.map((item) => item.shortLabel);

  it("mostra tudo, sem Mais, quando todos cabem", () => {
    for (const capacidade of [11, 12, 20]) {
      const { visiveis, excedentes } = dividirItensDaBarra(itens, capacidade);
      expect(visiveis).toEqual(itens);
      expect(excedentes).toEqual([]);
    }
  });

  it("reserva o último espaço para o Mais quando falta lugar", () => {
    const { visiveis, excedentes } = dividirItensDaBarra(itens, 5);
    expect(rotulos(visiveis)).toEqual(["Início", "Entrada", "Saída", "Pátio"]);
    expect(rotulos(excedentes)).toEqual(["Caixa", "Preços", "Usuários", "Mensalistas", "Notas", "Relatórios", "Empresa"]);
    expect(visiveis.length + 1).toBe(5);
  });

  it("com capacidade 10 esconde dois itens: nove visíveis mais o Mais", () => {
    const { visiveis, excedentes } = dividirItensDaBarra(itens, 10);
    expect(visiveis).toHaveLength(9);
    expect(excedentes).toHaveLength(2);
  });

  it("nunca usa menos de três espaços", () => {
    for (const capacidade of [0, 1, 2, 3]) {
      const { visiveis, excedentes } = dividirItensDaBarra(itens, capacidade);
      expect(rotulos(visiveis)).toEqual(["Início", "Entrada"]);
      expect(excedentes).toHaveLength(itens.length - 2);
    }
  });

  it("não perde nem repete item", () => {
    for (const capacidade of [0, 3, 4, 5, 7, 10, 11, 15]) {
      const { visiveis, excedentes } = dividirItensDaBarra(itens, capacidade);
      expect([...visiveis, ...excedentes]).toEqual(itens);
    }
  });

  it("perfil com poucos itens cabe sem Mais mesmo em tela estreita", () => {
    const operador = navItemsPorPrioridade(4);
    expect(dividirItensDaBarra(operador, 5).excedentes).toEqual([]);
    const financeiro = navItemsPorPrioridade(8);
    expect(dividirItensDaBarra(financeiro, 1)).toEqual({ visiveis: financeiro, excedentes: [] });
  });

  it("três itens cabem nos três espaços mínimos, sem Mais", () => {
    const tres = itens.slice(0, 3);
    expect(dividirItensDaBarra(tres, 2)).toEqual({ visiveis: tres, excedentes: [] });
  });
});

describe("isMaisAtivo", () => {
  const itens = navItemsPorPrioridade(1);
  const { excedentes } = dividirItensDaBarra(itens, 5);

  it("é verdadeiro quando a tela atual é um item que não coube na barra", () => {
    expect(isMaisAtivo("/caixa", excedentes)).toBe(true);
    expect(isMaisAtivo("/mensalistas/novo", excedentes)).toBe(true);
  });

  it("é falso quando a tela atual está na barra ou fora do menu", () => {
    expect(isMaisAtivo("/dashboard", excedentes)).toBe(false);
    expect(isMaisAtivo("/patio", excedentes)).toBe(false);
    expect(isMaisAtivo("/acesso-negado", excedentes)).toBe(false);
  });

  it("é falso sem itens excedentes", () => {
    expect(isMaisAtivo("/caixa", [])).toBe(false);
  });

  it("Entrada e Saída são ações e nunca deixam o Mais ativo", () => {
    expect(isMaisAtivo("/dashboard", itens.filter(isNavAction))).toBe(false);
  });
});

describe("ordenarPeloMenu", () => {
  it("devolve os itens na ordem do menu, sem alterar a lista recebida", () => {
    const embaralhados = [NAV_ITEMS[9], NAV_ITEMS[7], NAV_ITEMS[2]];
    const copia = [...embaralhados];

    expect(ordenarPeloMenu(embaralhados).map((item) => item.shortLabel)).toEqual(["Saída", "Mensalistas", "Relatórios"]);
    expect(embaralhados).toEqual(copia);
  });

  it("recoloca os excedentes da barra na ordem natural do menu", () => {
    const { excedentes } = dividirItensDaBarra(navItemsPorPrioridade(1), 5);
    expect(ordenarPeloMenu(excedentes).map((item) => item.shortLabel)).toEqual(["Caixa", "Preços", "Usuários", "Mensalistas", "Notas", "Relatórios", "Empresa"]);
  });
});
