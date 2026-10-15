// Espelha o JSON de /api/v1/Caixa. Datas chegam como ISO sem fuso (ex.: "2026-10-13T19:10:06.34044").
export const FORMA_PAGAMENTO = {
  Dinheiro: 1,
  Pix: 2,
  CartaoDebito: 3,
  CartaoCredito: 4,
  Boleto: 5,
  TransferenciaBancaria: 6,
} as const;

export type FormaPagamento = (typeof FORMA_PAGAMENTO)[keyof typeof FORMA_PAGAMENTO];

export const FORMA_PAGAMENTO_OPTIONS: { value: FormaPagamento; label: string }[] = [
  { value: FORMA_PAGAMENTO.Dinheiro, label: "Dinheiro" },
  { value: FORMA_PAGAMENTO.Pix, label: "Pix" },
  { value: FORMA_PAGAMENTO.CartaoDebito, label: "Cartão de débito" },
  { value: FORMA_PAGAMENTO.CartaoCredito, label: "Cartão de crédito" },
  { value: FORMA_PAGAMENTO.Boleto, label: "Boleto" },
  { value: FORMA_PAGAMENTO.TransferenciaBancaria, label: "Transferência bancária" },
];

// Código vindo da API; mantido como number para tolerar valores novos do backend.
export type FormaPagamentoId = number;

export type Caixa = {
  caixaId: number;
  dataHoraAbertura: string;
  // O GET /Caixa devolve o caixa aberto e omite os campos de fechamento (não vêm como null).
  dataHoraFechamento?: string | null;
  valorFundoCaixa: number;
  valorTotalEntrada: number | null;
  valorTotalSaida: number | null;
  valorTotalFechamento?: number | null;
  saldoAtual?: number;
  status?: number;
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
