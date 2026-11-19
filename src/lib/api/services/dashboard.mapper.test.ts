import { describe, expect, it } from "vitest";
import { dashboardDto, dashboardEmpresaNovaDto, dashboardMesFechadoDto, dashboardSemAlertasDto } from "./dashboard.fixture";
import { fromDashboardResponse } from "./dashboard.mapper";

function semUndefinedNemNaN(valor: unknown, caminho = "raiz"): string[] {
  if (valor === undefined) return [caminho];
  if (typeof valor === "number") return Number.isNaN(valor) ? [caminho] : [];
  if (Array.isArray(valor)) return valor.flatMap((item, i) => semUndefinedNemNaN(item, `${caminho}[${i}]`));
  if (valor && typeof valor === "object") {
    return Object.entries(valor).flatMap(([chave, item]) => semUndefinedNemNaN(item, `${caminho}.${chave}`));
  }
  return [];
}

describe("fromDashboardResponse", () => {
  it("lê a resposta de exemplo do levantamento", () => {
    const dashboard = fromDashboardResponse(dashboardDto);

    expect(dashboard.inicioUso).toBe("2026-11-07T11:53:37.265568");
    expect(dashboard.periodo).toMatchObject({ tipo: 1, fechado: false, faturamento: 0, saidas: 0, ticketMedio: null, permanenciaMediaMinutos: null });
    expect(dashboard.periodo.comparacao).toEqual({
      inicio: "2026-11-12T00:00:00",
      fim: "2026-11-12T15:45:45.5785897",
      faturamento: 160,
      variacaoPercentual: -100,
    });
    expect(dashboard.mes).toMatchObject({ faturado: 1403.5, diasDeUso: 13, diasNoMes: 30, mediaPorDia: 107.96, projecao: 2591.08 });
    expect(dashboard.patio).toMatchObject({ ocupados: 17, capacidade: 110, carros: { ocupados: 17, capacidade: 70 }, motos: { ocupados: 0, capacidade: 40 } });
    expect(dashboard.recebimento.map((linha) => linha.descricao)).toEqual(["PIX", "Dinheiro", "Cartão de débito", "Cartão de crédito"]);
    expect(dashboard.origem).toEqual({ avulso: 1202, mensalista: null, convenio: 1.5, lavaRapido: 200 });
    expect(dashboard.alertas?.veiculosParados).toEqual({
      quantidade: 15,
      horasMinimas: 72,
      maisAntigo: { idPatio: 105, placa: "LMA8376", permanenciaMinutos: 15862 },
    });
  });

  it("preserva o que é nulo: comparação do mês, fechamento do mês anterior, melhor dia e alertas sem pendência", () => {
    const { mes, alertas } = fromDashboardResponse(dashboardDto);

    expect(mes.comparacaoMesAnterior).toBeNull();
    expect(mes.fechamentoMesAnterior).toBeNull();
    expect(mes.melhorDia).toBeNull();
    expect(alertas?.mensalidadesAVencer).toBeNull();
    expect(alertas?.caixasComDiferenca).toBeNull();
    expect(alertas?.mensalistasInadimplentes).toEqual({ quantidade: 1, valor: 250 });
  });

  it("mantém as posições do faturamento diário, com nulo nos dias antes do início do uso", () => {
    const { faturamentoDiario } = fromDashboardResponse(dashboardDto);

    expect(faturamentoDiario).toHaveLength(30);
    expect(faturamentoDiario.slice(0, 17).every((dia) => dia === null)).toBe(true);
    expect(faturamentoDiario[17]).toEqual({ data: "2026-11-07T00:00:00", avulso: 171, mensalista: 0, convenio: 0, lavaRapido: 0 });
    expect(faturamentoDiario[29]?.data).toBe("2026-11-19T00:00:00");
  });

  it("normaliza o movimento por hora para 24 posições, com nulo nas horas que não chegaram", () => {
    const movimento = fromDashboardResponse(dashboardDto).movimentoPorHora;

    expect(movimento?.media).toBe(false);
    expect(movimento?.horas).toHaveLength(24);
    expect(movimento?.horas[15]).toEqual({ hora: 15, veiculos: 17, entradas: 0 });
    expect(movimento?.horas.slice(16).every((hora) => hora === null)).toBe(true);
    expect(movimento?.maiorMovimento).toEqual({ inicio: 0, fim: 3, veiculosMedia: 17 });
  });

  it("completa para 24 posições quando a API manda menos horas", () => {
    const movimento = fromDashboardResponse({ ...dashboardDto, movimentoPorHora: { media: true, horas: [{ hora: 0, veiculos: 2, entradas: 1 }] } }).movimentoPorHora;

    expect(movimento?.horas).toHaveLength(24);
    expect(movimento?.horas[0]).toEqual({ hora: 0, veiculos: 2, entradas: 1 });
    expect(movimento?.horas[1]).toBeNull();
    expect(movimento?.maiorMovimento).toBeNull();
  });

  it("lê o mês fechado, sem pátio nem alertas", () => {
    const dashboard = fromDashboardResponse(dashboardMesFechadoDto());

    expect(dashboard.periodo.fechado).toBe(true);
    expect(dashboard.patio).toBeNull();
    expect(dashboard.alertas).toBeNull();
    expect(dashboard.mes.melhorDia).toEqual({ data: "2026-10-17T00:00:00", faturamento: 810 });
    expect(dashboard.mes.fechamentoMesAnterior).toBe(8000);
    expect(dashboard.mes.comparacaoMesAnterior?.variacaoPercentual).toBe(14.01);
    expect(dashboard.categorias.map((linha) => linha.categoria)).toEqual(["Carro médio", "Carro pequeno", "Moto"]);
    expect(dashboard.movimentoPorHora?.media).toBe(true);
  });

  it("lê a empresa nova: sem início de uso, listas vazias e movimento nulo", () => {
    const dashboard = fromDashboardResponse(dashboardEmpresaNovaDto());

    expect(dashboard.inicioUso).toBeNull();
    expect(dashboard.faturamentoDiario).toEqual([]);
    expect(dashboard.recebimento).toEqual([]);
    expect(dashboard.categorias).toEqual([]);
    expect(dashboard.movimentoPorHora).toBeNull();
    expect(dashboard.periodo.comparacao).toBeNull();
  });

  it("lê alertas todos nulos sem inventar pendência", () => {
    const { alertas } = fromDashboardResponse(dashboardSemAlertasDto());

    expect(alertas).toEqual({
      mensalistasInadimplentes: null,
      mensalidadesAVencer: null,
      faturasConveniadaAbertas: null,
      caixasComDiferenca: null,
      veiculosParados: null,
    });
  });

  it("mantém a variação nula quando o período comparado não faturou", () => {
    const dto = { ...dashboardDto, periodo: { ...dashboardDto.periodo, comparacao: { inicio: "a", fim: "b", faturamento: 0, variacaoPercentual: null } } };

    expect(fromDashboardResponse(dto).periodo.comparacao?.variacaoPercentual).toBeNull();
  });

  it("descarta formas de recebimento e categorias sem valor", () => {
    const dto = {
      ...dashboardDto,
      recebimento: [
        { formaPagamento: 1, descricao: "Dinheiro", valor: 10 },
        { formaPagamento: 2, descricao: "PIX", valor: 0 },
      ],
      categorias: [
        { categoria: "Moto", saidas: 3, valor: 0 },
        { categoria: "Carro", saidas: 2, valor: 40 },
      ],
    };
    const dashboard = fromDashboardResponse(dto);

    expect(dashboard.recebimento).toEqual([{ formaPagamento: 1, descricao: "Dinheiro", valor: 10 }]);
    expect(dashboard.categorias).toEqual([{ categoria: "Carro", saidas: 2, valor: 40 }]);
  });

  it("usa a descrição da categoria quando `categoria` vem como id numérico", () => {
    const dashboard = fromDashboardResponse({
      ...dashboardDto,
      categorias: [
        { categoria: 2, descricao: "Carro pequeno", saidas: 4, faturamento: 175 },
        { categoria: 1, descricao: "Moto", saidas: 2, faturamento: 5 },
      ],
    });

    expect(dashboard.categorias).toEqual([
      { categoria: "Carro pequeno", saidas: 4, valor: 175 },
      { categoria: "Moto", saidas: 2, valor: 5 },
    ]);
  });

  it("campo ausente ou fora do formato nunca chega como undefined nem NaN", () => {
    const respostas = [{}, null, undefined, "texto", { periodo: { faturamento: "abc" }, mes: { faturado: undefined }, patio: { ocupados: "x" } }];
    for (const resposta of respostas) {
      expect(semUndefinedNemNaN(fromDashboardResponse(resposta))).toEqual([]);
    }
    for (const dto of [dashboardDto, dashboardMesFechadoDto(), dashboardEmpresaNovaDto(), dashboardSemAlertasDto()]) {
      expect(semUndefinedNemNaN(fromDashboardResponse(dto))).toEqual([]);
    }
  });

  it("período desconhecido vira Dia e o faturamento ausente vira 0", () => {
    const dashboard = fromDashboardResponse({ periodo: { tipo: 9 } });

    expect(dashboard.periodo.tipo).toBe(1);
    expect(dashboard.periodo.faturamento).toBe(0);
    expect(dashboard.periodo.fechado).toBe(false);
  });
});
