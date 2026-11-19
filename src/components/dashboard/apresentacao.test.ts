import { describe, expect, it } from "vitest";
import { dashboardDto, dashboardEmpresaNovaDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import type { Area } from "@/lib/permissoes";
import { lightTheme } from "@/styles/theme";
import { PERIODO_DASHBOARD, type Dashboard, type DashboardAlertas, type DashboardHora, type PeriodoDashboard } from "@/types/dashboard";
import {
  agruparHoras,
  corDoTema,
  detalheDoGrupo,
  distribuicaoOrigem,
  distribuicaoRecebimento,
  graficoDiario,
  grupoNaFaixa,
  horaInicialDoGrafico,
  horaNaFaixa,
  indicadoresDoMes,
  linhasDeCategoria,
  pendencias,
  primeiroNome,
  rotuloDasSaidas,
  rotuloFaturamento,
  saudacao,
  saudacaoCompleta,
  textoComparacao,
  textoFaixa,
  tituloDoMes,
  tituloPorHora,
  totalDeCategorias,
} from "./apresentacao";

const hoje = new Date(2026, 10, 19, 15, 45);

function base(): Dashboard {
  return fromDashboardResponse(dashboardDto);
}

function comPeriodo(dashboard: Dashboard, parcial: Partial<Dashboard["periodo"]>): Dashboard {
  return { ...dashboard, periodo: { ...dashboard.periodo, ...parcial } };
}

function comMes(dashboard: Dashboard, parcial: Partial<Dashboard["mes"]>): Dashboard {
  return { ...dashboard, mes: { ...dashboard.mes, ...parcial } };
}

const tipo = (valor: PeriodoDashboard) => valor;

describe("saudação", () => {
  it.each([
    [0, "Boa noite"],
    [4, "Boa noite"],
    [5, "Bom dia"],
    [11, "Bom dia"],
    [12, "Boa tarde"],
    [17, "Boa tarde"],
    [18, "Boa noite"],
    [23, "Boa noite"],
  ])("às %ih: %s", (hora, texto) => {
    expect(saudacao(hora)).toBe(texto);
  });

  it("usa só o primeiro nome", () => {
    expect(primeiroNome("Everton Silva")).toBe("Everton");
    expect(primeiroNome("  renato   roessler ")).toBe("renato");
    expect(primeiroNome("EVERTON SILVA")).toBe("Everton");
    expect(primeiroNome("")).toBe("");
    expect(primeiroNome(null)).toBe("");
    expect(saudacaoCompleta(10, "Everton Silva")).toBe("Bom dia, Everton");
    expect(saudacaoCompleta(10, "")).toBe("Bom dia");
    expect(saudacaoCompleta(20, undefined)).toBe("Boa noite");
  });
});

describe("textoComparacao", () => {
  it("dia: compara com o mesmo dia da semana anterior", () => {
    expect(textoComparacao(base(), hoje)).toBe("vs. quinta passada");
  });

  it("dia: sábado e domingo concordam no masculino", () => {
    const comparar = (inicio: string) => textoComparacao(comPeriodo(base(), { comparacao: { inicio, fim: inicio, faturamento: 10, variacaoPercentual: 5 } }), hoje);

    expect(comparar("2026-11-14T00:00:00")).toBe("vs. sábado passado");
    expect(comparar("2026-11-15T00:00:00")).toBe("vs. domingo passado");
    expect(comparar("2026-11-16T00:00:00")).toBe("vs. segunda passada");
  });

  it("semana em andamento compara o mesmo ponto; semana fechada, a anterior inteira", () => {
    const semana = comPeriodo(base(), { tipo: tipo(PERIODO_DASHBOARD.Semana) });

    expect(textoComparacao(semana, hoje)).toBe("vs. mesmo ponto da semana passada");
    expect(textoComparacao(comPeriodo(semana, { fechado: true }), hoje)).toBe("vs. semana anterior");
  });

  it("mês em andamento: 'vs. out até dia 19'; mês fechado: 'vs. setembro'", () => {
    const emAndamento = comPeriodo(base(), {
      tipo: tipo(PERIODO_DASHBOARD.Mes),
      comparacao: { inicio: "2026-10-01T00:00:00", fim: "2026-10-19T15:45:45", faturamento: 800, variacaoPercentual: 12 },
    });
    const fechado = fromDashboardResponse(dashboardMesFechadoDto());

    expect(textoComparacao(emAndamento, hoje)).toBe("vs. out até dia 19");
    expect(textoComparacao(fechado, hoje)).toBe("vs. setembro");
  });

  it("sem comparação, ou com a variação nula, não há texto", () => {
    expect(textoComparacao(comPeriodo(base(), { comparacao: null }), hoje)).toBeNull();
    expect(
      textoComparacao(comPeriodo(base(), { comparacao: { inicio: "2026-11-12T00:00:00", fim: "2026-11-12T10:00:00", faturamento: 0, variacaoPercentual: null } }), hoje),
    ).toBeNull();
  });
});

describe("rotuloFaturamento", () => {
  it("dia: hoje, ou o dia escolhido quando o período já fechou", () => {
    expect(rotuloFaturamento(base(), hoje)).toBe("Faturamento hoje");
    expect(rotuloFaturamento(comPeriodo(base(), { fechado: true, inicio: "2026-11-18T00:00:00", fim: "2026-11-18T00:00:00" }), hoje)).toBe(
      "Faturamento de qua, 18 nov",
    );
  });

  it("semana e mês", () => {
    expect(rotuloFaturamento(comPeriodo(base(), { tipo: tipo(PERIODO_DASHBOARD.Semana) }), hoje)).toBe("Faturamento da semana");
    expect(rotuloFaturamento(comPeriodo(base(), { tipo: tipo(PERIODO_DASHBOARD.Mes) }), hoje)).toBe("Faturamento do mês");
    expect(rotuloFaturamento(fromDashboardResponse(dashboardMesFechadoDto()), hoje)).toBe("Outubro fechou em");
  });
});

describe("indicadoresDoMes", () => {
  it("dia no mês em andamento (resposta de exemplo): mês até agora e projeção", () => {
    const [mesAteAgora, projecao] = indicadoresDoMes(base(), hoje);

    expect(mesAteAgora).toEqual({ rotulo: "Mês até agora", valor: "R$ 1.404", espera: false, subtexto: "desde 7 nov", tom: "neutro" });
    expect(projecao).toEqual({ rotulo: "Projeção do mês", valor: "R$ 2.591", espera: false, subtexto: "estimativa com base em 13 dias", tom: "neutro" });
  });

  it("mês em andamento: média por dia e projeção", () => {
    const [media, projecao] = indicadoresDoMes(comPeriodo(base(), { tipo: tipo(PERIODO_DASHBOARD.Mes) }), hoje);

    expect(media).toEqual({ rotulo: "Média por dia", valor: "R$ 108", espera: false, subtexto: "em 13 dias de uso no mês", tom: "neutro" });
    expect(projecao.valor).toBe("R$ 2.591");
  });

  it("média de um dia de uso fala no singular", () => {
    const [media] = indicadoresDoMes(comPeriodo(comMes(base(), { diasDeUso: 1 }), { tipo: tipo(PERIODO_DASHBOARD.Mes) }), hoje);

    expect(media.subtexto).toBe("em 1 dia de uso no mês");
  });

  it("projeção indisponível com menos de 5 dias de uso: avisa e conta quantos faltam", () => {
    const tres = indicadoresDoMes(comMes(base(), { projecao: null, diasDeUso: 3 }), hoje)[1];
    const quatro = indicadoresDoMes(comMes(base(), { projecao: null, diasDeUso: 4 }), hoje)[1];

    expect(tres).toMatchObject({ valor: "Disponível com 5 dias de uso", espera: true, subtexto: "faltam 2 dias de uso" });
    expect(quatro).toMatchObject({ espera: true, subtexto: "faltam 1 dia de uso" });
  });

  it("projeção ausente com 5 dias ou mais não inventa número", () => {
    expect(indicadoresDoMes(comMes(base(), { projecao: null, diasDeUso: 9 }), hoje)[1]).toMatchObject({ valor: "—", espera: false, subtexto: null });
  });

  it("com o mês anterior: mostra a variação e o quanto ele fechou", () => {
    const dashboard = comMes(base(), {
      comparacaoMesAnterior: { inicio: "2026-10-01T00:00:00", fim: "2026-10-19T15:45:00", faturamento: 1200, variacaoPercentual: 17 },
      fechamentoMesAnterior: 2100,
    });
    const antigo = { ...dashboard, inicioUso: "2025-03-02T09:10:00" };
    const [mesAteAgora, projecao] = indicadoresDoMes(antigo, hoje);

    expect(mesAteAgora).toMatchObject({ subtexto: "▲ 17% vs. out até dia 19", tom: "alta" });
    expect(projecao.subtexto).toBe("outubro fechou R$ 2.100");
  });

  it("queda em relação ao mês anterior", () => {
    const dashboard = comMes(base(), { comparacaoMesAnterior: { inicio: "2026-10-01T00:00:00", fim: "2026-10-19T00:00:00", faturamento: 2000, variacaoPercentual: -30 } });

    expect(indicadoresDoMes(dashboard, hoje)[0]).toMatchObject({ subtexto: "▼ 30% vs. out até dia 19", tom: "queda" });
  });

  it("mês fechado: média por dia e melhor dia", () => {
    const [media, melhor] = indicadoresDoMes(fromDashboardResponse(dashboardMesFechadoDto()), hoje);

    expect(media).toEqual({ rotulo: "Média por dia", valor: "R$ 294", espera: false, subtexto: "31 dias com movimento", tom: "neutro" });
    expect(melhor).toEqual({ rotulo: "Melhor dia", valor: "R$ 810", espera: false, subtexto: "sáb, 17 out", tom: "neutro" });
  });

  it("mês fechado sem melhor dia ou média não inventa valor", () => {
    const dashboard = comMes(fromDashboardResponse(dashboardMesFechadoDto()), { melhorDia: null, mediaPorDia: null });
    const [media, melhor] = indicadoresDoMes(dashboard, hoje);

    expect(media).toMatchObject({ valor: "—", subtexto: null });
    expect(melhor).toMatchObject({ valor: "—", subtexto: null });
  });

  it("dia ou semana dentro de um mês fechado: quanto o mês fechou, com a variação, e a média por dia", () => {
    const dashboard = comPeriodo(fromDashboardResponse(dashboardMesFechadoDto()), { tipo: tipo(PERIODO_DASHBOARD.Dia) });
    const [fechou, media] = indicadoresDoMes(dashboard, hoje);

    expect(fechou).toEqual({ rotulo: "Outubro fechou em", valor: "R$ 9.121", espera: false, subtexto: "▲ 14% vs. setembro", tom: "alta" });
    expect(media).toMatchObject({ rotulo: "Média por dia", subtexto: "no mês de outubro" });
  });
});

describe("pendencias", () => {
  const todas = () => true;
  const completos: DashboardAlertas = {
    mensalistasInadimplentes: { quantidade: 4, valor: 1120 },
    mensalidadesAVencer: { quantidade: 7, valor: 2310 },
    faturasConveniadaAbertas: { quantidade: 2, valor: 860 },
    caixasComDiferenca: { quantidade: 1, valor: -35 },
    veiculosParados: { quantidade: 15, horasMinimas: 72, maisAntigo: { idPatio: 105, placa: "LMA8376", permanenciaMinutos: 15862 } },
  };

  it("resposta de exemplo: só as três pendências que existem, da mais grave à menos", () => {
    const itens = pendencias(base().alertas, todas);

    expect(itens.map((item) => item.id)).toEqual(["inadimplentes", "parados", "faturas"]);
    expect(itens[0]).toEqual({
      id: "inadimplentes",
      tom: "danger",
      icone: "alerta",
      titulo: "Mensalistas inadimplentes",
      resumo: "R$ 250 em atraso",
      quantidade: 1,
      href: "/mensalistas?aba=lista",
    });
    expect(itens[1]).toMatchObject({
      tom: "caution",
      titulo: "Veículos há mais de 3 dias",
      resumo: "Mais antigo: LMA8376 · 11d 0h",
      quantidade: 15,
      href: "/patio/105",
    });
    expect(itens[2]).toMatchObject({ tom: "info", titulo: "Faturas de conveniadas abertas", resumo: "R$ 1,50 a receber", quantidade: 1, href: "/faturas" });
  });

  it("as cinco pendências seguem a ordem de severidade, com os tons e os destinos", () => {
    const itens = pendencias(completos, todas);

    expect(itens.map((item) => [item.id, item.tom, item.href])).toEqual([
      ["inadimplentes", "danger", "/mensalistas?aba=lista"],
      ["caixa", "danger", "/caixa/historico"],
      ["parados", "caution", "/patio/105"],
      ["aVencer", "caution", "/mensalistas"],
      ["faturas", "info", "/faturas"],
    ]);
    expect(itens[3].resumo).toBe("R$ 2.310 a receber");
    expect(itens[3].titulo).toBe("Mensalidades vencem em 5 dias");
  });

  it("o caixa diz se falta ou sobra, com palavra e não só com sinal", () => {
    const resumo = (quantidade: number, valor: number) => pendencias({ ...completos, caixasComDiferenca: { quantidade, valor } }, todas)[1].resumo;

    expect(resumo(1, -35)).toBe("1 turno nos últimos 7 dias · Falta R$ 35,00");
    expect(resumo(3, 12.5)).toBe("3 turnos nos últimos 7 dias · Sobra R$ 12,50");
    expect(resumo(2, 0)).toBe("2 turnos nos últimos 7 dias");
  });

  it("veículo parado sem o mais antigo informado leva ao Pátio", () => {
    const itens = pendencias({ ...completos, veiculosParados: { quantidade: 2, horasMinimas: 72, maisAntigo: null } }, todas);
    const parados = itens.find((item) => item.id === "parados");

    expect(parados).toMatchObject({ resumo: "Avulsos parados no pátio", href: "/patio" });
  });

  it("o tempo parado vem em dias quando fecha dias e em horas quando não", () => {
    const titulo = (horasMinimas: number) =>
      pendencias({ ...completos, veiculosParados: { quantidade: 1, horasMinimas, maisAntigo: null } }, todas).find((item) => item.id === "parados")?.titulo;

    expect(titulo(48)).toBe("Veículos há mais de 2 dias");
    expect(titulo(24)).toBe("Veículos há mais de 1 dia");
    expect(titulo(36)).toBe("Veículos há mais de 36 horas");
  });

  it("sem acesso à tela de destino, a linha continua mas sem link", () => {
    const semFinanceiro = (area: Area) => area !== "faturas" && area !== "caixa.historico";
    const itens = pendencias(completos, semFinanceiro);

    expect(itens.find((item) => item.id === "faturas")?.href).toBeNull();
    expect(itens.find((item) => item.id === "caixa")?.href).toBeNull();
    expect(itens.find((item) => item.id === "inadimplentes")?.href).toBe("/mensalistas?aba=lista");
    expect(pendencias(completos, () => false).every((item) => item.href === null)).toBe(true);
  });

  it("sem alertas ou com todos nulos, a lista é vazia", () => {
    expect(pendencias(null, todas)).toEqual([]);
    expect(
      pendencias(
        { mensalistasInadimplentes: null, mensalidadesAVencer: null, faturasConveniadaAbertas: null, caixasComDiferenca: null, veiculosParados: null },
        todas,
      ),
    ).toEqual([]);
  });
});

describe("distribuições", () => {
  it("origem: omite a que não teve valor (mensalista nulo) e calcula a participação", () => {
    const { linhas, total } = distribuicaoOrigem(base().origem);

    expect(linhas.map((linha) => [linha.nome, linha.valor, linha.cor])).toEqual([
      ["Avulso", 1202, "cliente.avulso"],
      ["Convênios", 1.5, "cliente.conveniado"],
      ["Lava-rápido", 200, "primary"],
    ]);
    expect(total).toBe(1403.5);
    expect(linhas[0].percentual).toBeCloseTo(85.64, 1);
    expect(linhas.reduce((soma, linha) => soma + linha.percentual, 0)).toBeCloseTo(100, 5);
  });

  it("origem: mensalistas aparecem com a cor de mensalista", () => {
    const { linhas } = distribuicaoOrigem({ avulso: 10, mensalista: 30, convenio: null, lavaRapido: null });

    expect(linhas.map((linha) => [linha.nome, linha.cor])).toEqual([
      ["Avulso", "cliente.avulso"],
      ["Mensalistas", "cliente.mensal"],
    ]);
    expect(linhas[1].percentual).toBe(75);
  });

  it("origem: sem nenhum valor, nada para mostrar", () => {
    expect(distribuicaoOrigem({ avulso: null, mensalista: null, convenio: null, lavaRapido: 0 })).toEqual({ linhas: [], total: 0 });
    expect(distribuicaoOrigem(fromDashboardResponse(dashboardEmpresaNovaDto()).origem).linhas).toEqual([]);
  });

  it("recebimento: usa o nome da API, na ordem recebida, com a cor de cada forma de pagamento", () => {
    const { linhas, total } = distribuicaoRecebimento(base().recebimento);

    expect(linhas.map((linha) => [linha.nome, linha.valor, linha.cor])).toEqual([
      ["PIX", 544.5, "pagamento.pix"],
      ["Dinheiro", 391.5, "pagamento.dinheiro"],
      ["Cartão de débito", 270, "pagamento.debito"],
      ["Cartão de crédito", 197.5, "pagamento.credito"],
    ]);
    expect(total).toBe(1403.5);
  });

  it("recebimento: forma sem cor própria usa steel e linha sem valor some", () => {
    const { linhas } = distribuicaoRecebimento([
      { formaPagamento: 5, descricao: "Boleto", valor: 50 },
      { formaPagamento: 1, descricao: "Dinheiro", valor: 0 },
    ]);

    expect(linhas).toEqual([{ chave: "forma-5", nome: "Boleto", valor: 50, percentual: 100, cor: "steel" }]);
    expect(distribuicaoRecebimento([])).toEqual({ linhas: [], total: 0 });
  });

  it("corDoTema resolve cada chave para uma cor do tema", () => {
    const cores = lightTheme.colors;

    expect(corDoTema(cores, "cliente.avulso")).toBe(cores.cliente.avulso);
    expect(corDoTema(cores, "cliente.mensal")).toBe(cores.cliente.mensal);
    expect(corDoTema(cores, "cliente.conveniado")).toBe(cores.cliente.conveniado);
    expect(corDoTema(cores, "pagamento.pix")).toBe(cores.pagamento.pix);
    expect(corDoTema(cores, "pagamento.dinheiro")).toBe(cores.pagamento.dinheiro);
    expect(corDoTema(cores, "pagamento.debito")).toBe(cores.pagamento.debito);
    expect(corDoTema(cores, "pagamento.credito")).toBe(cores.pagamento.credito);
    expect(corDoTema(cores, "steel")).toBe(cores.steel);
    expect(corDoTema(cores, "primary")).toBe(cores.primary);
  });
});

describe("veículos por hora", () => {
  const horasDoExemplo = () => base().movimentoPorHora!.horas;
  const hora = (h: number, veiculos: number, entradas: number): DashboardHora => ({ hora: h, veiculos, entradas });

  it("agrupa de 1 em 1: 24 grupos, com as horas que não chegaram vazias", () => {
    const grupos = agruparHoras(horasDoExemplo(), 1);

    expect(grupos).toHaveLength(24);
    expect(grupos[15]).toEqual({ hora: 15, horaFim: 16, veiculos: 17, entradas: 0, vazio: false });
    expect(grupos.slice(16).every((grupo) => grupo.vazio)).toBe(true);
    expect(grupos[16]).toEqual({ hora: 16, horaFim: 17, veiculos: 0, entradas: 0, vazio: true });
  });

  it("agrupa de 2 em 2: média dos veículos e soma das entradas", () => {
    const horas = Array.from({ length: 24 }, () => null) as (DashboardHora | null)[];
    horas[0] = hora(0, 10, 2);
    horas[1] = hora(1, 11, 3);
    const grupos = agruparHoras(horas, 2);

    expect(grupos).toHaveLength(12);
    expect(grupos[0]).toEqual({ hora: 0, horaFim: 2, veiculos: 11, entradas: 5, vazio: false });
    expect(grupos[11]).toEqual({ hora: 22, horaFim: 24, veiculos: 0, entradas: 0, vazio: true });
  });

  it("grupo com uma hora conhecida e outra que não chegou usa só a conhecida", () => {
    const grupos = agruparHoras(horasDoExemplo().map((item) => (item && item.hora === 15 ? hora(15, 9, 1) : item?.hora === 14 ? hora(14, 9, 1) : item)), 2);

    expect(grupos[7]).toMatchObject({ hora: 14, veiculos: 9, entradas: 2, vazio: false });
    const parcial = agruparHoras([...Array.from({ length: 15 }, () => null), hora(15, 6, 4), ...Array.from({ length: 8 }, () => null)] as (DashboardHora | null)[], 2);
    expect(parcial[7]).toMatchObject({ veiculos: 6, entradas: 4, vazio: false });
  });

  it("a faixa de 3 horas pode virar o dia", () => {
    const faixa = { inicio: 22, fim: 1, veiculosMedia: 30 };

    expect([22, 23, 0].every((h) => horaNaFaixa(h, faixa))).toBe(true);
    expect(horaNaFaixa(1, faixa)).toBe(false);
    expect(horaNaFaixa(21, faixa)).toBe(false);
    expect(horaNaFaixa(5, null)).toBe(false);
  });

  it("o grupo fica em destaque quando alguma hora dele está na faixa", () => {
    const faixa = { inicio: 11, fim: 14, veiculosMedia: 30 };
    const grupos = agruparHoras(horasDoExemplo(), 2);

    expect(grupos.filter((grupo) => grupoNaFaixa(grupo, faixa)).map((grupo) => grupo.hora)).toEqual([10, 12]);
    expect(grupoNaFaixa(grupos[0], null)).toBe(false);
  });

  it("textoFaixa mostra a faixa como a API mandou", () => {
    expect(textoFaixa({ inicio: 11, fim: 14, veiculosMedia: 30 })).toBe("11h – 14h");
  });

  it("hora inicial: hoje abre na hora atual", () => {
    const grupos = agruparHoras(horasDoExemplo(), 1);

    expect(horaInicialDoGrafico(grupos, base().movimentoPorHora!.maiorMovimento, 15)).toBe(15);
  });

  it("hora inicial: se a hora atual ainda não tem dado, usa a última que já chegou", () => {
    const grupos = agruparHoras(horasDoExemplo(), 1);

    expect(horaInicialDoGrafico(grupos, null, 20)).toBe(15);
  });

  it("hora inicial: fora de hoje abre na hora seguinte ao início do maior movimento, ou meio-dia", () => {
    const grupos = agruparHoras(fromDashboardResponse(dashboardMesFechadoDto()).movimentoPorHora!.horas, 1);

    expect(horaInicialDoGrafico(grupos, { inicio: 16, fim: 19, veiculosMedia: 57 }, null)).toBe(17);
    expect(horaInicialDoGrafico(grupos, null, null)).toBe(12);
  });

  it("hora inicial alinha ao grupo quando as horas vêm de 2 em 2", () => {
    const grupos = agruparHoras(horasDoExemplo(), 2);

    expect(horaInicialDoGrafico(grupos, null, 15)).toBe(14);
  });

  it("hora inicial é nula quando nenhuma hora chegou", () => {
    expect(horaInicialDoGrafico(agruparHoras(Array.from({ length: 24 }, () => null), 1), null, null)).toBeNull();
  });

  it("detalhe da hora de um dia: veículos, % das vagas e entradas", () => {
    const grupo = { hora: 10, horaFim: 11, veiculos: 17, entradas: 3, vazio: false };

    expect(detalheDoGrupo(grupo, { media: false, capacidade: 110 })).toEqual({
      titulo: "10h – 11h",
      veiculos: "17 veículos no pátio · 15% das vagas",
      entradas: "3 entradas nessa hora",
    });
  });

  it("detalhe na média (semana e mês) avisa que o número é uma média", () => {
    const grupo = { hora: 10, horaFim: 11, veiculos: 1, entradas: 1, vazio: false };

    expect(detalheDoGrupo(grupo, { media: true, capacidade: 110 })).toEqual({
      titulo: "10h – 11h",
      veiculos: "1 veículo no pátio em média · 1% das vagas",
      entradas: "1 entrada em média nessa hora",
    });
  });

  it("detalhe de horas agrupadas mostra a faixa e fala em média", () => {
    const grupo = { hora: 10, horaFim: 12, veiculos: 20, entradas: 6, vazio: false };

    expect(detalheDoGrupo(grupo, { media: false, capacidade: 110 })).toEqual({
      titulo: "10h – 12h",
      veiculos: "20 veículos no pátio em média · 18% das vagas",
      entradas: "6 entradas nessas 2 horas",
    });
  });

  it("sem capacidade, o detalhe não calcula percentual", () => {
    const grupo = { hora: 3, horaFim: 4, veiculos: 2, entradas: 0, vazio: false };

    expect(detalheDoGrupo(grupo, { media: false, capacidade: 0 }).veiculos).toBe("2 veículos no pátio");
  });
});

describe("tituloDoMes", () => {
  it("mês em andamento: o título fica como está", () => {
    expect(tituloDoMes("De onde vem o dinheiro", base().mes, hoje)).toBe("De onde vem o dinheiro");
  });

  it("mês fechado: o título diz o mês", () => {
    const { mes } = fromDashboardResponse(dashboardMesFechadoDto());

    expect(tituloDoMes("Como você recebe", mes, hoje)).toBe("Como você recebe · outubro");
  });

  it("mês de outro ano traz o ano", () => {
    const { mes } = fromDashboardResponse(dashboardMesFechadoDto());

    expect(tituloDoMes("Como você recebe", { ...mes, referencia: "2025-10-01T00:00:00" }, hoje)).toBe("Como você recebe · outubro de 2025");
  });
});

describe("categorias", () => {
  const categorias = [
    { categoria: "Moto", saidas: 120, valor: 100 },
    { categoria: "Carro médio", saidas: 160, valor: 3100 },
    { categoria: "Carro pequeno", saidas: 130, valor: 2000 },
  ];

  it("ordena da categoria com mais saídas para a com menos e mede o trilho pela maior", () => {
    const linhas = linhasDeCategoria(categorias);

    expect(linhas.map((linha) => linha.categoria)).toEqual(["Carro médio", "Carro pequeno", "Moto"]);
    expect(linhas.map((linha) => linha.proporcao)).toEqual([1, 130 / 160, 120 / 160]);
  });

  it("empate de saídas: a de maior valor vem primeiro", () => {
    const linhas = linhasDeCategoria([
      { categoria: "A", saidas: 5, valor: 10 },
      { categoria: "B", saidas: 5, valor: 90 },
    ]);

    expect(linhas.map((linha) => linha.categoria)).toEqual(["B", "A"]);
  });

  it("não considera categoria sem valor e não altera a lista recebida", () => {
    const original = [...categorias, { categoria: "Caminhão", saidas: 9, valor: 0 }];
    const linhas = linhasDeCategoria(original);

    expect(linhas.map((linha) => linha.categoria)).not.toContain("Caminhão");
    expect(original[0].categoria).toBe("Moto");
    expect(linhasDeCategoria([])).toEqual([]);
  });

  it("soma as saídas e os valores", () => {
    expect(totalDeCategorias(linhasDeCategoria(categorias))).toEqual({ saidas: 410, valor: 5200 });
    expect(totalDeCategorias([])).toEqual({ saidas: 0, valor: 0 });
  });

  it("o rótulo das saídas acompanha o período", () => {
    expect(rotuloDasSaidas(PERIODO_DASHBOARD.Dia)).toBe("saídas do dia");
    expect(rotuloDasSaidas(PERIODO_DASHBOARD.Semana)).toBe("saídas da semana");
    expect(rotuloDasSaidas(PERIODO_DASHBOARD.Mes)).toBe("saídas do mês");
  });
});

describe("graficoDiario", () => {
  const dia = (ano: number, mes: number, d: number) => new Date(ano, mes - 1, d);

  it("resposta de exemplo: 30 dias até hoje, com os 17 primeiros antes do início do uso", () => {
    const grafico = graficoDiario(base(), hoje);

    expect(grafico.titulo).toBe("Faturamento · 30 dias até hoje");
    expect(grafico.colunas).toHaveLength(30);
    expect(grafico.colunas.slice(0, 17).every((coluna) => coluna.valores === null)).toBe(true);
    expect(grafico.colunas[17].valores).toEqual({ avulso: 171, mensalista: 0, convenio: 0, lavaRapido: 0 });
    expect(grafico.vazio).toBe(false);
  });

  it("recontam as datas dos dias sem dados a partir do último dia", () => {
    const { colunas } = graficoDiario(base(), hoje);

    expect(colunas[0].data).toEqual(dia(2026, 10, 21));
    expect(colunas[16].data).toEqual(dia(2026, 11, 6));
    expect(colunas[17].data).toEqual(dia(2026, 11, 7));
    expect(colunas[29].data).toEqual(dia(2026, 11, 19));
  });

  it("o eixo mostra o primeiro dia, o do meio e Hoje", () => {
    expect(graficoDiario(base(), hoje).eixo).toEqual(["21 out", "5 nov", "Hoje"]);
  });

  it("o maior total e a legenda só com as origens que tiveram valor", () => {
    const grafico = graficoDiario(base(), hoje);

    expect(grafico.maximo).toBe(638);
    expect(grafico.legenda.map((item) => item.chave)).toEqual(["avulso", "convenio", "lavaRapido"]);
  });

  it("o resumo para leitor de tela traz o período, o total e o melhor dia", () => {
    expect(graficoDiario(base(), hoje).resumo).toBe("Faturamento de 21 out a 19 nov: total de R$ 1.404, melhor dia seg, 9 nov, com R$ 638.");
  });

  it("dia: só o dia escolhido é destacado e os outros ficam esmaecidos", () => {
    const { colunas } = graficoDiario(base(), hoje);

    expect(colunas[29].destaque).toBe("selecionado");
    expect(colunas.slice(0, 29).every((coluna) => coluna.destaque === "esmaecido")).toBe(true);
  });

  it("semana: os dias da semana ficam cheios e o resto esmaecido", () => {
    const semana = comPeriodo(base(), { tipo: tipo(PERIODO_DASHBOARD.Semana), inicio: "2026-11-16T00:00:00", fim: "2026-11-22T00:00:00" });
    const { colunas } = graficoDiario(semana, hoje);

    expect(colunas.filter((coluna) => coluna.destaque === "normal").map((coluna) => coluna.data.getDate())).toEqual([16, 17, 18, 19]);
    expect(colunas.filter((coluna) => coluna.destaque === "esmaecido")).toHaveLength(26);
  });

  it("mês em andamento: só hoje é destacado", () => {
    const mes = comPeriodo(base(), { tipo: tipo(PERIODO_DASHBOARD.Mes), inicio: "2026-11-01T00:00:00", fim: "2026-11-30T00:00:00" });
    const { colunas } = graficoDiario(mes, hoje);

    expect(colunas.filter((coluna) => coluna.destaque === "selecionado")).toHaveLength(1);
    expect(colunas[29].destaque).toBe("selecionado");
    expect(colunas.filter((coluna) => coluna.destaque === "esmaecido")).toHaveLength(0);
  });

  it("mês fechado: os dias do mês, sem destaque, com as quatro origens", () => {
    const grafico = graficoDiario(fromDashboardResponse(dashboardMesFechadoDto()), hoje);

    expect(grafico.titulo).toBe("Faturamento por dia · outubro");
    expect(grafico.colunas).toHaveLength(31);
    expect(grafico.colunas[0].data).toEqual(dia(2026, 10, 1));
    expect(grafico.colunas.every((coluna) => coluna.destaque === "normal")).toBe(true);
    expect(grafico.eixo).toEqual(["1 out", "16 out", "31 out"]);
    expect(grafico.legenda).toHaveLength(4);
  });

  it("dia dentro de um mês fechado: o dia escolhido é destacado", () => {
    const dashboard = comPeriodo(fromDashboardResponse(dashboardMesFechadoDto()), { tipo: tipo(PERIODO_DASHBOARD.Dia), inicio: "2026-10-17T00:00:00", fim: "2026-10-17T00:00:00" });
    const { colunas } = graficoDiario(dashboard, hoje);

    expect(colunas.filter((coluna) => coluna.destaque === "selecionado").map((coluna) => coluna.data.getDate())).toEqual([17]);
  });

  it("empresa nova: vazio, sem colunas nem legenda", () => {
    const grafico = graficoDiario(fromDashboardResponse(dashboardEmpresaNovaDto()), hoje);

    expect(grafico).toMatchObject({ vazio: true, colunas: [], legenda: [], maximo: 0, titulo: "Faturamento · 30 dias até hoje" });
    expect(grafico.resumo).toBe("Ainda não há dias com saídas registradas.");
  });

  it("período sem nenhum faturamento diz isso no resumo, sem inventar melhor dia", () => {
    const dashboard = base();
    const zerados = { ...dashboard, faturamentoDiario: dashboard.faturamentoDiario.map((item) => (item ? { ...item, avulso: 0, convenio: 0, lavaRapido: 0 } : item)) };
    const grafico = graficoDiario(zerados, hoje);

    expect(grafico.resumo).toBe("Faturamento de 21 out a 19 nov: sem faturamento.");
    expect(grafico.maximo).toBe(0);
    expect(grafico.legenda).toEqual([]);
  });

  it("série que termina antes de hoje diz até que dia vai", () => {
    const dashboard = comMes(fromDashboardResponse(dashboardDto), {});
    const ontem = { ...dashboard, faturamentoDiario: dashboard.faturamentoDiario.slice(0, 29) };
    const grafico = graficoDiario(ontem, hoje);

    expect(grafico.titulo).toBe("Faturamento · 30 dias até 18 nov");
    expect(grafico.eixo[2]).toBe("18 nov");
  });
});

describe("tituloPorHora", () => {
  it("dia em andamento é hoje; dia que já fechou diz qual foi", () => {
    expect(tituloPorHora(base().periodo, hoje)).toBe("Veículos no pátio por hora · hoje");
    expect(tituloPorHora({ ...base().periodo, fechado: true, inicio: "2026-11-18T00:00:00" }, hoje)).toBe("Veículos no pátio por hora · qua, 18 nov");
  });

  it("semana e mês são médias", () => {
    expect(tituloPorHora({ ...base().periodo, tipo: tipo(PERIODO_DASHBOARD.Semana) }, hoje)).toBe("Veículos no pátio por hora · média da semana");
    expect(tituloPorHora({ ...base().periodo, tipo: tipo(PERIODO_DASHBOARD.Mes) }, hoje)).toBe("Veículos no pátio por hora · média do mês");
  });
});
