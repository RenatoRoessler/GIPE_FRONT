// Espelha GET /api/v1/Dashboard já normalizado por `dashboard.mapper.ts`. Datas chegam como ISO sem fuso
// (ex.: "2026-11-19T15:45:45.5785897"). Campo nulo significa "não se aplica" e a tela o esconde: nunca vira 0.
//
// Formatos SUPOSTOS (vieram nulos ou vazios na resposta de exemplo e ainda não foram conferidos com a API):
// `mes.comparacaoMesAnterior`, `mes.fechamentoMesAnterior`, `mes.melhorDia`, `alertas.mensalidadesAVencer`,
// `alertas.caixasComDiferenca` e o item de `categorias`. Qualquer ajuste fica neste arquivo e no mapper.

export const PERIODO_DASHBOARD = { Dia: 1, Semana: 2, Mes: 3 } as const;
export type PeriodoDashboard = (typeof PERIODO_DASHBOARD)[keyof typeof PERIODO_DASHBOARD];

export type DashboardComparacao = {
  inicio: string;
  fim: string;
  faturamento: number;
  // Nulo quando o período comparado não faturou.
  variacaoPercentual: number | null;
};

export type DashboardOrigemValores = {
  avulso: number;
  mensalista: number;
  convenio: number;
  lavaRapido: number;
};

export type DashboardOcupacao = { ocupados: number; capacidade: number };

export type DashboardQuantidadeValor = { quantidade: number; valor: number };

export type DashboardFaixaMovimento = {
  // Faixa de 3 horas: `inicio` e `fim` são horas cheias (0 a 23; `fim` pode virar o dia).
  inicio: number;
  fim: number;
  veiculosMedia: number;
};

export type DashboardHora = { hora: number; veiculos: number; entradas: number };

export type DashboardDia = DashboardOrigemValores & { data: string };

export type DashboardPeriodo = {
  tipo: PeriodoDashboard;
  inicio: string;
  fim: string;
  fechado: boolean;
  faturamento: number;
  comparacao: DashboardComparacao | null;
  saidas: number;
  // Só avulsos, sem o lava-rápido. Nulo sem saídas.
  ticketMedio: number | null;
  permanenciaMediaMinutos: number | null;
};

export type DashboardMes = {
  referencia: string;
  fechado: boolean;
  faturado: number;
  diasDeUso: number;
  diasNoMes: number;
  mediaPorDia: number | null;
  comparacaoMesAnterior: DashboardComparacao | null;
  // Só no mês em andamento com 5 dias de uso.
  projecao: number | null;
  // Só se o mês anterior foi completo.
  fechamentoMesAnterior: number | null;
  // Só no mês fechado.
  melhorDia: { data: string; faturamento: number } | null;
};

export type DashboardPatio = {
  ocupados: number;
  capacidade: number;
  carros: DashboardOcupacao;
  motos: DashboardOcupacao;
  avulsos: number;
  mensalistas: number;
};

export type DashboardAlertas = {
  mensalistasInadimplentes: DashboardQuantidadeValor | null;
  // Mensalidades que vencem em até 5 dias.
  mensalidadesAVencer: DashboardQuantidadeValor | null;
  faturasConveniadaAbertas: DashboardQuantidadeValor | null;
  // Turnos com diferença nos últimos 7 dias. `valor` é a soma das diferenças (negativa quando falta).
  caixasComDiferenca: DashboardQuantidadeValor | null;
  // Veículos avulsos há mais de `horasMinimas` horas (72).
  veiculosParados: {
    quantidade: number;
    horasMinimas: number;
    maisAntigo: { idPatio: number; placa: string; permanenciaMinutos: number } | null;
  } | null;
};

export type DashboardRecebimento = { formaPagamento: number; descricao: string; valor: number };

export type DashboardCategoria = { categoria: string; saidas: number; valor: number };

export type DashboardMovimentoPorHora = {
  // Em semana e mês é a média por dia.
  media: boolean;
  // 24 posições; nulo nas horas que ainda não chegaram hoje.
  horas: (DashboardHora | null)[];
  maiorMovimento: DashboardFaixaMovimento | null;
  menorMovimento: DashboardFaixaMovimento | null;
};

export type Dashboard = {
  dataReferencia: string;
  // Data da primeira saída. Nulo = empresa nova.
  inicioUso: string | null;
  periodo: DashboardPeriodo;
  mes: DashboardMes;
  // Só no período em andamento.
  patio: DashboardPatio | null;
  alertas: DashboardAlertas | null;
  // Nulo nos dias antes do início do uso.
  faturamentoDiario: (DashboardDia | null)[];
  // Nulo quando a origem não teve valor no mês.
  origem: { [K in keyof DashboardOrigemValores]: number | null };
  recebimento: DashboardRecebimento[];
  categorias: DashboardCategoria[];
  movimentoPorHora: DashboardMovimentoPorHora | null;
};

export type DashboardParams = {
  periodo: PeriodoDashboard;
  // AAAA-MM-DD. Omitida = hoje.
  data?: string;
};
