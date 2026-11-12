import { describe, expect, it } from "vitest";
import { lightTheme, darkTheme } from "@/styles/theme";
import { agruparItens, BARRA_FIXA, dividirItensDaBarra, GRUPOS_NAV, isMaisAtivo, isNavAction, isNavActive, isNavItemActive, montarBarraFixa, NAV_ITEMS, navItemKey, navItemsPermitidos, navItemsPorPrioridade, ordenarPeloMenu } from "./nav";

describe("NAV_ITEMS", () => {
  it("o Pátio é um link do grupo Operação, o primeiro do grupo, seguido da Entrada e da Saída", () => {
    const rotulos = NAV_ITEMS.map((item) => item.label);

    expect(NAV_ITEMS.find((item) => item.label === "Pátio")).toEqual({ label: "Pátio", shortLabel: "Pátio", href: "/patio", icon: "yard", area: "patio", grupo: "operacao" });
    expect(rotulos.slice(rotulos.indexOf("Pátio"), rotulos.indexOf("Pátio") + 3)).toEqual(["Pátio", "Entrada de Veículos", "Saída de Veículos"]);
    expect(NAV_ITEMS.filter((item) => item.grupo === "operacao")[0].label).toBe("Pátio");
  });

  it("a Visão Geral abre o menu, fora de qualquer grupo, e leva ao /dashboard", () => {
    expect(NAV_ITEMS[0]).toEqual({ label: "Visão Geral", shortLabel: "Visão Geral", href: "/dashboard", icon: "dashboard", area: "inicio" });
    expect(NAV_ITEMS[0].grupo).toBeUndefined();
  });

  it("a Conferência de pátio é um link da área do Pátio, o último do grupo Operação antes dos Serviços, e cabe no rótulo curto", () => {
    expect(NAV_ITEMS.find((item) => item.label === "Conferência de pátio")).toEqual({
      label: "Conferência de pátio",
      shortLabel: "Conferência",
      href: "/conferencia-patio",
      icon: "checklist",
      area: "patio",
      grupo: "operacao",
    });
    const operacao = NAV_ITEMS.filter((item) => item.grupo === "operacao");
    expect(operacao[operacao.length - 2].label).toBe("Conferência de pátio");
  });

  it("os Serviços são um link da área de Serviços, o último do grupo Operação", () => {
    expect(NAV_ITEMS.find((item) => item.label === "Serviços")).toEqual({
      label: "Serviços",
      shortLabel: "Serviços",
      href: "/servicos",
      icon: "services",
      area: "servicos",
      grupo: "operacao",
    });
    const operacao = NAV_ITEMS.filter((item) => item.grupo === "operacao");
    expect(operacao[operacao.length - 1].label).toBe("Serviços");
  });

  it("mantém os dezenove itens (um por tela), na ordem do menu", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Visão Geral",
      "Pátio",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Conferência de pátio",
      "Serviços",
      "Financeiro",
      "Caixa",
      "Faturas",
      "Notas Fiscais",
      "Minha Empresa",
      "Configurações",
      "Gestão de Preços",
      "Quadros de Chaves",
      "Mensalistas",
      "Gestão de Usuários",
      "Empresas conveniadas",
      "Carimbar ticket",
      "Pátio da conveniada",
    ]);
  });

  it("todo item tem um grupo, menos a Visão Geral e os dois da conveniada, que ficam fora dos grupos", () => {
    const semGrupo = NAV_ITEMS.filter((item) => item.grupo === undefined).map((item) => item.label);
    const ids: string[] = GRUPOS_NAV.map((grupo) => grupo.id);

    expect(semGrupo).toEqual(["Visão Geral", "Carimbar ticket", "Pátio da conveniada"]);
    expect(NAV_ITEMS.slice(-2).map((item) => item.label)).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
    for (const item of NAV_ITEMS.filter((navItem) => navItem.grupo !== undefined)) {
      expect(ids).toContain(item.grupo);
    }
  });

  it("os itens de cada grupo ficam juntos, e os grupos seguem a ordem de GRUPOS_NAV", () => {
    expect(GRUPOS_NAV.map((grupo) => grupo.titulo)).toEqual(["Operação", "Financeiro", "Configurações"]);
    const ordemDosGrupos = NAV_ITEMS.filter((item) => item.grupo !== undefined).map((item) => item.grupo);
    const semRepeticao = ordemDosGrupos.filter((grupo, indice) => grupo !== ordemDosGrupos[indice - 1]);
    expect(semRepeticao).toEqual(["operacao", "financeiro", "configuracoes"]);
  });

  it("Entrada e Saída são ações (abrem modal); os outros dezessete são links", () => {
    const acoes = NAV_ITEMS.filter(isNavAction);
    expect(acoes.map((item) => [item.label, item.acao, item.icon])).toEqual([
      ["Entrada de Veículos", "entrada", "vehicleIn"],
      ["Saída de Veículos", "saida", "vehicleOut"],
    ]);
    expect(NAV_ITEMS.filter((item) => !isNavAction(item))).toHaveLength(17);
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
    expect(item).toEqual({ label: "Notas Fiscais", shortLabel: "Notas", href: "/notas-fiscais", icon: "invoice", area: "notas-fiscais", grupo: "financeiro" });
  });

  it("fica ativo em /notas-fiscais e nas rotas filhas, não em rotas parecidas", () => {
    expect(isNavActive("/notas-fiscais", item)).toBe(true);
    expect(isNavActive("/notas-fiscais?aba=lancadas", item)).toBe(false);
    expect(isNavActive("/notas-fiscais/x", item)).toBe(true);
    expect(isNavActive("/notas", item)).toBe(false);
  });
});

describe("Financeiro no menu", () => {
  const item = NAV_ITEMS.find((navItem) => navItem.label === "Financeiro")!;

  it("é um link para /financeiro, com ícone próprio, o primeiro item do grupo Financeiro", () => {
    expect(item).toEqual({ label: "Financeiro", shortLabel: "Financeiro", href: "/financeiro", icon: "finance", area: "financeiro", grupo: "financeiro" });
    expect(NAV_ITEMS.filter((navItem) => navItem.grupo === "financeiro")[0]).toBe(item);
  });

  it("fica ativo em /financeiro e nas rotas filhas, não em rotas parecidas", () => {
    expect(isNavActive("/financeiro", item)).toBe(true);
    expect(isNavActive("/financeiro/x", item)).toBe(true);
    expect(isNavActive("/financeiros", item)).toBe(false);
  });

  it("não está entre os itens que a barra inferior mostra primeiro", () => {
    expect(navItemsPorPrioridade(1).slice(0, 4).map((navItem) => navItem.label)).not.toContain("Financeiro");
  });
});

describe("navItemsPermitidos", () => {
  const rotulos = (perfil: Parameters<typeof navItemsPermitidos>[0]) => navItemsPermitidos(perfil).map((item) => item.label);

  it("o Administrador vê tudo, menos o Carimbo e o pátio da conveniada, que são da conveniada", () => {
    expect(navItemsPermitidos(1)).toEqual(NAV_ITEMS.filter((item) => item.label !== "Carimbar ticket" && item.label !== "Pátio da conveniada"));
    expect(rotulos(1)).not.toContain("Carimbar ticket");
    expect(rotulos(1)).not.toContain("Pátio da conveniada");
  });

  it("o Gerente não vê usuários nem a empresa", () => {
    expect(rotulos(2)).toEqual([
      "Visão Geral",
      "Pátio",
      "Entrada de Veículos",
      "Saída de Veículos",
      "Conferência de pátio",
      "Serviços",
      "Financeiro",
      "Caixa",
      "Faturas",
      "Notas Fiscais",
      "Configurações",
      "Gestão de Preços",
      "Quadros de Chaves",
      "Mensalistas",
    ]);
  });

  it("o Caixa e o Manobrista só veem o dia a dia do pátio e do caixa", () => {
    const esperado = ["Visão Geral", "Pátio", "Entrada de Veículos", "Saída de Veículos", "Conferência de pátio", "Serviços", "Caixa"];
    expect(rotulos(4)).toEqual(esperado);
    expect(rotulos(3)).toEqual(esperado);
  });

  it("o Financeiro vê a visão geral, o financeiro, as faturas e as notas fiscais", () => {
    expect(rotulos(8)).toEqual(["Visão Geral", "Financeiro", "Faturas", "Notas Fiscais"]);
  });

  it("o Administrador da conveniada vê só o carimbo e o pátio da conveniada", () => {
    expect(rotulos(5)).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
  });

  it("o Gerente e o Usuário da conveniada vêem só o carimbo e o pátio da conveniada", () => {
    expect(rotulos(6)).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
    expect(rotulos(7)).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
  });

  it("o Lavador vê a visão geral e os serviços", () => {
    expect(rotulos(9)).toEqual(["Visão Geral", "Serviços"]);
  });

  it("sem perfil conhecido só o Início", () => {
    expect(rotulos(null)).toEqual(["Visão Geral"]);
    expect(rotulos(undefined)).toEqual(["Visão Geral"]);
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

  it("Pátio, Entrada, Saída e Caixa vêm primeiro e o resto segue a ordem do menu", () => {
    expect(rotulos(1)).toEqual(["Pátio", "Entrada", "Saída", "Caixa", "Visão Geral", "Conferência", "Serviços", "Financeiro", "Faturas", "Notas", "Empresa", "Config.", "Preços", "Chaves", "Mensalistas", "Usuários", "Conveniadas"]);
  });

  it("só traz o que o perfil pode abrir", () => {
    expect(rotulos(4)).toEqual(["Pátio", "Entrada", "Saída", "Caixa", "Visão Geral", "Conferência", "Serviços"]);
    expect(rotulos(8)).toEqual(["Visão Geral", "Financeiro", "Faturas", "Notas"]);
    expect(rotulos(null)).toEqual(["Visão Geral"]);
  });

  it("tem os mesmos itens do menu, só em outra ordem", () => {
    const doMenu = NAV_ITEMS.filter((item) => item.label !== "Carimbar ticket" && item.label !== "Pátio da conveniada");
    expect(navItemsPorPrioridade(1)).toHaveLength(doMenu.length);
    expect(new Set(navItemsPorPrioridade(1).map(navItemKey))).toEqual(new Set(doMenu.map(navItemKey)));
  });

  it("devolve a mesma ordem a cada chamada", () => {
    expect(rotulos(1)).toEqual(rotulos(1));
  });
});

describe("dividirItensDaBarra", () => {
  const itens = navItemsPorPrioridade(1);
  const rotulos = (lista: typeof itens) => lista.map((item) => item.shortLabel);

  it("mostra tudo, sem Mais, quando todos cabem", () => {
    for (const capacidade of [17, 18, 20]) {
      const { visiveis, excedentes } = dividirItensDaBarra(itens, capacidade);
      expect(visiveis).toEqual(itens);
      expect(excedentes).toEqual([]);
    }
  });

  it("reserva o último espaço para o Mais quando falta lugar", () => {
    const { visiveis, excedentes } = dividirItensDaBarra(itens, 5);
    expect(rotulos(visiveis)).toEqual(["Pátio", "Entrada", "Saída", "Caixa"]);
    expect(rotulos(excedentes)).toEqual(["Visão Geral", "Conferência", "Serviços", "Financeiro", "Faturas", "Notas", "Empresa", "Config.", "Preços", "Chaves", "Mensalistas", "Usuários", "Conveniadas"]);
    expect(visiveis.length + 1).toBe(5);
  });

  it("com capacidade 9 esconde nove itens: oito visíveis mais o Mais", () => {
    const { visiveis, excedentes } = dividirItensDaBarra(itens, 9);
    expect(visiveis).toHaveLength(8);
    expect(excedentes).toHaveLength(9);
  });

  it("nunca usa menos de cinco espaços", () => {
    for (const capacidade of [0, 1, 2, 3]) {
      const { visiveis, excedentes } = dividirItensDaBarra(itens, capacidade);
      expect(rotulos(visiveis)).toEqual(["Pátio", "Entrada", "Saída", "Caixa"]);
      expect(excedentes).toHaveLength(itens.length - 4);
    }
  });

  it("não perde nem repete item", () => {
    for (const capacidade of [0, 3, 4, 5, 7, 9, 10, 15]) {
      const { visiveis, excedentes } = dividirItensDaBarra(itens, capacidade);
      expect([...visiveis, ...excedentes]).toEqual(itens);
    }
  });

  it("perfil com poucos itens: em tela estreita o Dashboard vai para o Mais, em tela larga cabe tudo", () => {
    const operador = navItemsPorPrioridade(4);
    expect(dividirItensDaBarra(operador, 5).excedentes.map((item) => item.shortLabel)).toEqual(["Visão Geral", "Conferência", "Serviços"]);
    expect(dividirItensDaBarra(operador, 8).excedentes).toEqual([]);
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
    expect(isMaisAtivo("/dashboard", excedentes)).toBe(true);
    expect(isMaisAtivo("/mensalistas/novo", excedentes)).toBe(true);
  });

  it("é falso quando a tela atual está na barra ou fora do menu", () => {
    expect(isMaisAtivo("/caixa", excedentes)).toBe(false);
    expect(isMaisAtivo("/patio", excedentes)).toBe(false);
    expect(isMaisAtivo("/acesso-negado", excedentes)).toBe(false);
  });

  it("é falso sem itens excedentes", () => {
    expect(isMaisAtivo("/dashboard", [])).toBe(false);
  });

  it("Entrada e Saída são ações e nunca deixam o Mais ativo", () => {
    expect(isMaisAtivo("/dashboard", itens.filter(isNavAction))).toBe(false);
  });
});

describe("ordenarPeloMenu", () => {
  it("devolve os itens na ordem do menu, sem alterar a lista recebida", () => {
    const item = (rotulo: string) => NAV_ITEMS.find((navItem) => navItem.shortLabel === rotulo)!;
    const embaralhados = [item("Empresa"), item("Mensalistas"), item("Saída")];
    const copia = [...embaralhados];

    expect(ordenarPeloMenu(embaralhados).map((item) => item.shortLabel)).toEqual(["Saída", "Empresa", "Mensalistas"]);
    expect(embaralhados).toEqual(copia);
  });

  it("recoloca os excedentes da barra na ordem natural do menu", () => {
    const { excedentes } = dividirItensDaBarra(navItemsPorPrioridade(1), 5);
    expect(ordenarPeloMenu(excedentes).map((item) => item.shortLabel)).toEqual(["Visão Geral", "Conferência", "Serviços", "Financeiro", "Faturas", "Notas", "Empresa", "Config.", "Preços", "Chaves", "Mensalistas", "Usuários", "Conveniadas"]);
  });
});

describe("montarBarraFixa", () => {
  it("perfil operacional: Pátio, Caixa, Entrada e Saída, com a Entrada no centro de cinco posições com o Mais", () => {
    const barra = montarBarraFixa(1);

    expect(barra?.itens.map((item) => item.shortLabel)).toEqual(["Pátio", "Caixa", "Entrada", "Saída"]);
  });

  it("os excedentes não repetem os quatro itens e seguem a ordem do menu", () => {
    const barra = montarBarraFixa(1);
    const esperados = navItemsPermitidos(1).filter((item) => !BARRA_FIXA.includes(navItemKey(item)));

    expect(barra?.excedentes).toEqual(esperados);
    expect(barra?.excedentes.map((item) => item.shortLabel)).toContain("Visão Geral");
    expect(barra?.excedentes.map((item) => item.shortLabel)).not.toContain("Entrada");
  });

  it("perfil da conveniada, que não tem o pátio, e perfil desconhecido usam a barra adaptativa", () => {
    expect(montarBarraFixa(5)).toBeNull();
    expect(montarBarraFixa(7)).toBeNull();
    expect(montarBarraFixa(null)).toBeNull();
    expect(montarBarraFixa(undefined)).toBeNull();
  });

  it("BARRA_FIXA tem as mesmas chaves da prioridade da barra adaptativa", () => {
    const prioritarios = navItemsPorPrioridade(1).slice(0, BARRA_FIXA.length).map(navItemKey);

    expect([...prioritarios].sort()).toEqual([...BARRA_FIXA].sort());
  });
});

describe("agruparItens", () => {
  const rotulos = (perfil: Parameters<typeof navItemsPermitidos>[0]) =>
    agruparItens(navItemsPermitidos(perfil)).map((grupo) => [grupo.titulo, grupo.itens.map((item) => item.label)]);

  it("o Administrador tem a Visão Geral sem grupo e, depois, Operação, Financeiro e Configurações, com os itens na ordem do menu", () => {
    expect(rotulos(1)).toEqual([
      [null, ["Visão Geral"]],
      ["Operação", ["Pátio", "Entrada de Veículos", "Saída de Veículos", "Conferência de pátio", "Serviços"]],
      ["Financeiro", ["Financeiro", "Caixa", "Faturas", "Notas Fiscais"]],
      ["Configurações", ["Minha Empresa", "Configurações", "Gestão de Preços", "Quadros de Chaves", "Mensalistas", "Gestão de Usuários", "Empresas conveniadas"]],
    ]);
  });

  it("grupo sem item permitido não aparece", () => {
    expect(rotulos(4)).toEqual([
      [null, ["Visão Geral"]],
      ["Operação", ["Pátio", "Entrada de Veículos", "Saída de Veículos", "Conferência de pátio", "Serviços"]],
      ["Financeiro", ["Caixa"]],
    ]);
    expect(rotulos(8)).toEqual([
      [null, ["Visão Geral"]],
      ["Financeiro", ["Financeiro", "Faturas", "Notas Fiscais"]],
    ]);
  });

  it("os itens da conveniada ficam num bloco sem título", () => {
    const grupos = agruparItens(navItemsPermitidos(5));

    expect(grupos).toHaveLength(1);
    expect(grupos[0].id).toBeNull();
    expect(grupos[0].titulo).toBeNull();
    expect(grupos[0].itens.map((item) => item.label)).toEqual(["Carimbar ticket", "Pátio da conveniada"]);
  });

  it("o bloco sem grupo vem antes dos grupos", () => {
    const grupos = agruparItens(NAV_ITEMS);

    expect(grupos.map((grupo) => grupo.titulo)).toEqual([null, "Operação", "Financeiro", "Configurações"]);
  });

  it("preserva a ordem recebida dentro de cada grupo e não repete nem perde item", () => {
    const invertidos = [...navItemsPermitidos(1)].reverse();
    const grupos = agruparItens(invertidos);

    expect(grupos[2].itens.map((item) => item.label)).toEqual(["Notas Fiscais", "Faturas", "Caixa", "Financeiro"]);
    expect(grupos.flatMap((grupo) => grupo.itens)).toHaveLength(invertidos.length);
  });

  it("lista vazia não tem grupo nenhum", () => {
    expect(agruparItens([])).toEqual([]);
  });
});
