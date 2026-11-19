import {
  PERIODO_DASHBOARD,
  type Dashboard,
  type DashboardAlertas,
  type DashboardCategoria,
  type DashboardComparacao,
  type DashboardDia,
  type DashboardFaixaMovimento,
  type DashboardHora,
  type DashboardMes,
  type DashboardMovimentoPorHora,
  type DashboardOcupacao,
  type DashboardPatio,
  type DashboardPeriodo,
  type DashboardQuantidadeValor,
  type DashboardRecebimento,
  type PeriodoDashboard,
} from "@/types/dashboard";
import { toNumber, toText } from "./mapperUtils";

// Leitura tolerante de GET /Dashboard. Os formatos de `comparacaoMesAnterior`, `fechamentoMesAnterior`, `melhorDia`,
// `mensalidadesAVencer`, `caixasComDiferenca` e do item de `categorias` ainda não foram vistos na API: toda suposição sobre eles
// fica aqui e em `types/dashboard.ts`. Nulo significa "não se aplica" e é preservado; número ausente onde a regra diz que
// sempre há valor vira 0, nunca undefined (viraria NaN nas somas e nos valores em reais).

type Dto = Record<string, unknown>;

export const HORAS_DO_DIA = 24;

function dto(valor: unknown): Dto | null {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Dto) : null;
}

function numero(valor: unknown): number {
  return toNumber(valor) ?? 0;
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

function periodoTipo(valor: unknown): PeriodoDashboard {
  const tipo = toNumber(valor);
  return tipo === PERIODO_DASHBOARD.Semana || tipo === PERIODO_DASHBOARD.Mes ? tipo : PERIODO_DASHBOARD.Dia;
}

function comparacao(valor: unknown): DashboardComparacao | null {
  const d = dto(valor);
  if (!d) return null;
  return {
    inicio: toText(d.inicio) ?? "",
    fim: toText(d.fim) ?? "",
    faturamento: numero(d.faturamento),
    variacaoPercentual: toNumber(d.variacaoPercentual),
  };
}

function quantidadeValor(valor: unknown): DashboardQuantidadeValor | null {
  const d = dto(valor);
  if (!d) return null;
  return { quantidade: numero(d.quantidade), valor: numero(d.valor ?? d.valorTotal) };
}

function ocupacao(valor: unknown): DashboardOcupacao {
  const d = dto(valor);
  return { ocupados: numero(d?.ocupados), capacidade: numero(d?.capacidade) };
}

function periodo(valor: unknown): DashboardPeriodo {
  const d = dto(valor) ?? {};
  return {
    tipo: periodoTipo(d.tipo),
    inicio: toText(d.inicio) ?? "",
    fim: toText(d.fim) ?? "",
    fechado: d.fechado === true,
    faturamento: numero(d.faturamento),
    comparacao: comparacao(d.comparacao),
    saidas: numero(d.saidas),
    ticketMedio: toNumber(d.ticketMedio),
    permanenciaMediaMinutos: toNumber(d.permanenciaMediaMinutos),
  };
}

function melhorDia(valor: unknown): DashboardMes["melhorDia"] {
  const d = dto(valor);
  const data = toText(d?.data);
  if (!d || !data) return null;
  return { data, faturamento: numero(d.faturamento ?? d.valor ?? d.faturado) };
}

function fechamentoAnterior(valor: unknown): number | null {
  const d = dto(valor);
  // Aceita o número direto ou um objeto com o faturamento do mês.
  return d ? toNumber(d.faturamento ?? d.faturado ?? d.valor) : toNumber(valor);
}

function mes(valor: unknown): DashboardMes {
  const d = dto(valor) ?? {};
  return {
    referencia: toText(d.referencia) ?? "",
    fechado: d.fechado === true,
    faturado: numero(d.faturado),
    diasDeUso: numero(d.diasDeUso),
    diasNoMes: numero(d.diasNoMes),
    mediaPorDia: toNumber(d.mediaPorDia),
    comparacaoMesAnterior: comparacao(d.comparacaoMesAnterior),
    projecao: toNumber(d.projecao),
    fechamentoMesAnterior: fechamentoAnterior(d.fechamentoMesAnterior),
    melhorDia: melhorDia(d.melhorDia),
  };
}

function patio(valor: unknown): DashboardPatio | null {
  const d = dto(valor);
  if (!d) return null;
  return {
    ocupados: numero(d.ocupados),
    capacidade: numero(d.capacidade),
    carros: ocupacao(d.carros),
    motos: ocupacao(d.motos),
    avulsos: numero(d.avulsos),
    mensalistas: numero(d.mensalistas),
  };
}

function veiculosParados(valor: unknown): DashboardAlertas["veiculosParados"] {
  const d = dto(valor);
  if (!d) return null;
  const antigo = dto(d.maisAntigo);
  return {
    quantidade: numero(d.quantidade),
    horasMinimas: numero(d.horasMinimas),
    maisAntigo: antigo
      ? { idPatio: numero(antigo.idPatio), placa: toText(antigo.placa) ?? "", permanenciaMinutos: numero(antigo.permanenciaMinutos) }
      : null,
  };
}

function alertas(valor: unknown): DashboardAlertas | null {
  const d = dto(valor);
  if (!d) return null;
  return {
    mensalistasInadimplentes: quantidadeValor(d.mensalistasInadimplentes),
    mensalidadesAVencer: quantidadeValor(d.mensalidadesAVencer),
    faturasConveniadaAbertas: quantidadeValor(d.faturasConveniadaAbertas),
    caixasComDiferenca: quantidadeValor(d.caixasComDiferenca),
    veiculosParados: veiculosParados(d.veiculosParados),
  };
}

function dia(valor: unknown): DashboardDia | null {
  const d = dto(valor);
  if (!d) return null;
  return {
    data: toText(d.data) ?? "",
    avulso: numero(d.avulso),
    mensalista: numero(d.mensalista),
    convenio: numero(d.convenio),
    lavaRapido: numero(d.lavaRapido),
  };
}

function recebimento(valor: unknown): DashboardRecebimento[] {
  return lista(valor)
    .map((item) => {
      const d = dto(item) ?? {};
      return { formaPagamento: numero(d.formaPagamento), descricao: toText(d.descricao) ?? "Outras formas", valor: numero(d.valor) };
    })
    .filter((linha) => linha.valor > 0);
}

function categorias(valor: unknown): DashboardCategoria[] {
  return lista(valor)
    .map((item) => {
      const d = dto(item) ?? {};
      return {
        categoria: toText(d.descricao ?? d.nome ?? d.categoria) ?? "Sem categoria",
        saidas: numero(d.saidas ?? d.quantidade),
        valor: numero(d.valor ?? d.faturamento),
      };
    })
    .filter((linha) => linha.valor > 0);
}

function hora(valor: unknown, posicao: number): DashboardHora | null {
  const d = dto(valor);
  if (!d) return null;
  return { hora: toNumber(d.hora) ?? posicao, veiculos: numero(d.veiculos), entradas: numero(d.entradas) };
}

function faixa(valor: unknown): DashboardFaixaMovimento | null {
  const d = dto(valor);
  if (!d || toNumber(d.inicio) === null || toNumber(d.fim) === null) return null;
  return { inicio: numero(d.inicio), fim: numero(d.fim), veiculosMedia: numero(d.veiculosMedia) };
}

function movimentoPorHora(valor: unknown): DashboardMovimentoPorHora | null {
  const d = dto(valor);
  if (!d) return null;
  const itens = lista(d.horas);
  return {
    media: d.media === true,
    // Sempre 24 posições, na ordem do dia: o que falta ou não chegou ainda é nulo.
    horas: Array.from({ length: HORAS_DO_DIA }, (_, posicao) => hora(itens[posicao], posicao)),
    maiorMovimento: faixa(d.maiorMovimento),
    menorMovimento: faixa(d.menorMovimento),
  };
}

export function fromDashboardResponse(valor: unknown): Dashboard {
  const d = dto(valor) ?? {};
  const origem = dto(d.origem) ?? {};
  return {
    dataReferencia: toText(d.dataReferencia) ?? "",
    inicioUso: toText(d.inicioUso),
    periodo: periodo(d.periodo),
    mes: mes(d.mes),
    patio: patio(d.patio),
    alertas: alertas(d.alertas),
    faturamentoDiario: lista(d.faturamentoDiario).map(dia),
    origem: {
      avulso: toNumber(origem.avulso),
      mensalista: toNumber(origem.mensalista),
      convenio: toNumber(origem.convenio),
      lavaRapido: toNumber(origem.lavaRapido),
    },
    recebimento: recebimento(d.recebimento),
    categorias: categorias(d.categorias),
    movimentoPorHora: movimentoPorHora(d.movimentoPorHora),
  };
}
