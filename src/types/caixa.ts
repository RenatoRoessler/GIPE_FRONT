// Espelha o JSON de /api/v1/Caixa. Datas chegam como ISO sem fuso (ex.: "2026-10-13T19:10:06.34044").
export type FormaPagamentoId = number;

export type Caixa = {
  caixaId: number;
  dataHoraAbertura: string;
  dataHoraFechamento: string | null;
  valorFundoCaixa: number;
  valorTotalEntrada: number | null;
  valorTotalSaida: number | null;
  valorTotalFechamento: number | null;
  status: number;
};

export type CaixaSaldo = {
  dataAbertura: string;
  fundoCaixa: number;
  totalEntrada: number;
  totalSaida: number;
  saldo: number;
};

export type TurnoFormaPagamento = {
  formaPagamento: FormaPagamentoId;
  entradas: number;
  saidas: number;
  valorEsperado: number;
  valorInformado: number | null;
  diferenca: number | null;
};

export type Turno = {
  turnoId: number;
  caixaId: number;
  usuarioId: number;
  usuario: string;
  usuarioIdFechamento: number | null;
  dataHoraInicio: string;
  dataHoraFim: string | null;
  valorInicial: number;
  status: number;
  totalEsperado: number;
  totalInformado: number | null;
  totalDiferenca: number | null;
  observacao: string | null;
  trocoPadrao: number | null;
  disponivelSangria: number | null;
  formasPagamento: TurnoFormaPagamento[];
};

export type Conferencia = {
  formaPagamento: FormaPagamentoId;
  valorInformado: number;
};

export type PassagemTurnoInput = {
  conferencias: Conferencia[];
  // Dinheiro que fica na gaveta; null faz o backend assumir o dinheiro conferido.
  valorInicial: number | null;
  observacao?: string;
};
