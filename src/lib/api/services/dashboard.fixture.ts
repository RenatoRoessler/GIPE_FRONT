// Resposta de GET /api/v1/Dashboard?periodo=1 de 2026-11-19 (empresa em uso desde 2026-11-07), copiada do levantamento da feature
// (docs/specs/input.md). Placa e valores são os do servidor de teste. As fábricas abaixo derivam variações dela.
// Os formatos de `comparacaoMesAnterior`, `fechamentoMesAnterior`, `melhorDia`, `mensalidadesAVencer`, `caixasComDiferenca` e do
// item de `categorias` NÃO foram vistos na API: o que está aqui para eles é suposição (ver `types/dashboard.ts`).

type Dto = Record<string, unknown>;

const horasAteAgora = Array.from({ length: 16 }, (_, hora) => ({ hora, veiculos: 17, entradas: 0 }));

export const dashboardDto = {
  dataReferencia: "2026-11-19T15:45:45.5785897",
  inicioUso: "2026-11-07T11:53:37.265568",
  periodo: {
    tipo: 1,
    inicio: "2026-11-19T00:00:00",
    fim: "2026-11-19T00:00:00",
    fechado: false,
    faturamento: 0,
    comparacao: { inicio: "2026-11-12T00:00:00", fim: "2026-11-12T15:45:45.5785897", faturamento: 160, variacaoPercentual: -100 },
    saidas: 0,
    ticketMedio: null,
    permanenciaMediaMinutos: null,
  },
  mes: {
    referencia: "2026-11-01T00:00:00",
    fechado: false,
    faturado: 1403.5,
    diasDeUso: 13,
    diasNoMes: 30,
    mediaPorDia: 107.96,
    comparacaoMesAnterior: null,
    projecao: 2591.08,
    fechamentoMesAnterior: null,
    melhorDia: null,
  },
  patio: {
    ocupados: 17,
    capacidade: 110,
    carros: { ocupados: 17, capacidade: 70 },
    motos: { ocupados: 0, capacidade: 40 },
    avulsos: 17,
    mensalistas: 0,
  },
  alertas: {
    mensalistasInadimplentes: { quantidade: 1, valor: 250 },
    mensalidadesAVencer: null,
    faturasConveniadaAbertas: { quantidade: 1, valor: 1.5 },
    caixasComDiferenca: null,
    veiculosParados: { quantidade: 15, horasMinimas: 72, maisAntigo: { idPatio: 105, placa: "LMA8376", permanenciaMinutos: 15862 } },
  },
  faturamentoDiario: [
    ...Array.from({ length: 17 }, () => null),
    { data: "2026-11-07T00:00:00", avulso: 171, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-08T00:00:00", avulso: 13, mensalista: 0, convenio: 1.5, lavaRapido: 0 },
    { data: "2026-11-09T00:00:00", avulso: 638, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-10T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-11T00:00:00", avulso: 40, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-12T00:00:00", avulso: 160, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-13T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 100 },
    { data: "2026-11-14T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-15T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-16T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-17T00:00:00", avulso: 180, mensalista: 0, convenio: 0, lavaRapido: 0 },
    { data: "2026-11-18T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 100 },
    { data: "2026-11-19T00:00:00", avulso: 0, mensalista: 0, convenio: 0, lavaRapido: 0 },
  ],
  origem: { avulso: 1202, mensalista: null, convenio: 1.5, lavaRapido: 200 },
  recebimento: [
    { formaPagamento: 2, descricao: "PIX", valor: 544.5 },
    { formaPagamento: 1, descricao: "Dinheiro", valor: 391.5 },
    { formaPagamento: 3, descricao: "Cartão de débito", valor: 270 },
    { formaPagamento: 4, descricao: "Cartão de crédito", valor: 197.5 },
  ],
  categorias: [],
  movimentoPorHora: {
    media: false,
    horas: [...horasAteAgora, ...Array.from({ length: 8 }, () => null)],
    maiorMovimento: { inicio: 0, fim: 3, veiculosMedia: 17 },
    menorMovimento: { inicio: 0, fim: 3, veiculosMedia: 17 },
  },
} satisfies Dto;

// Mesma empresa olhando outubro, já fechado: sem pátio, alertas nem lacunas de uso; com categorias, melhor dia e comparação.
export function dashboardMesFechadoDto(): Dto {
  return {
    ...dashboardDto,
    inicioUso: "2025-03-02T09:10:00",
    periodo: {
      tipo: 3,
      inicio: "2026-10-01T00:00:00",
      fim: "2026-10-31T00:00:00",
      fechado: true,
      faturamento: 9120.5,
      comparacao: { inicio: "2026-09-01T00:00:00", fim: "2026-09-30T00:00:00", faturamento: 8000, variacaoPercentual: 14.01 },
      saidas: 410,
      ticketMedio: 17.4,
      permanenciaMediaMinutos: 112,
    },
    mes: {
      referencia: "2026-10-01T00:00:00",
      fechado: true,
      faturado: 9120.5,
      diasDeUso: 31,
      diasNoMes: 31,
      mediaPorDia: 294.2,
      comparacaoMesAnterior: { inicio: "2026-09-01T00:00:00", fim: "2026-09-30T00:00:00", faturamento: 8000, variacaoPercentual: 14.01 },
      projecao: null,
      fechamentoMesAnterior: 8000,
      melhorDia: { data: "2026-10-17T00:00:00", faturamento: 810 },
    },
    patio: null,
    alertas: null,
    faturamentoDiario: Array.from({ length: 31 }, (_, i) => ({
      data: `2026-10-${String(i + 1).padStart(2, "0")}T00:00:00`,
      avulso: 200 + i * 5,
      mensalista: i === 0 ? 3600 : 0,
      convenio: 20,
      lavaRapido: 30,
    })),
    origem: { avulso: 5200, mensalista: 3600, convenio: 620, lavaRapido: 930 },
    categorias: [
      { categoria: "Carro médio", saidas: 160, valor: 3100 },
      { categoria: "Carro pequeno", saidas: 130, valor: 2000 },
      { categoria: "Moto", saidas: 120, valor: 100 },
    ],
    movimentoPorHora: {
      media: true,
      horas: Array.from({ length: 24 }, (_, hora) => ({ hora, veiculos: hora >= 8 && hora <= 18 ? 40 + hora : 5, entradas: hora >= 8 && hora <= 18 ? 6 : 0 })),
      maiorMovimento: { inicio: 16, fim: 19, veiculosMedia: 57 },
      menorMovimento: { inicio: 0, fim: 3, veiculosMedia: 5 },
    },
  };
}

// Empresa que ainda não registrou nenhuma saída: listas vazias, sem comparação e sem movimento por hora.
export function dashboardEmpresaNovaDto(): Dto {
  return {
    ...dashboardDto,
    inicioUso: null,
    periodo: { ...dashboardDto.periodo, comparacao: null },
    mes: { ...dashboardDto.mes, faturado: 0, diasDeUso: 0, mediaPorDia: null, projecao: null },
    patio: {
      ocupados: 0,
      capacidade: 110,
      carros: { ocupados: 0, capacidade: 70 },
      motos: { ocupados: 0, capacidade: 40 },
      avulsos: 0,
      mensalistas: 0,
    },
    alertas: null,
    faturamentoDiario: [],
    origem: { avulso: null, mensalista: null, convenio: null, lavaRapido: null },
    recebimento: [],
    categorias: [],
    movimentoPorHora: null,
  };
}

// A resposta de exemplo sem nenhuma pendência.
export function dashboardSemAlertasDto(): Dto {
  return {
    ...dashboardDto,
    alertas: {
      mensalistasInadimplentes: null,
      mensalidadesAVencer: null,
      faturasConveniadaAbertas: null,
      caixasComDiferenca: null,
      veiculosParados: null,
    },
  };
}
