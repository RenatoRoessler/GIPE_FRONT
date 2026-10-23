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
  // Diferença da conferência no fechamento, quando o histórico a devolve (positiva sobra, negativa falta).
  totalDiferenca?: number | null;
  // Fundo contado na gaveta no fechamento (PUT /Caixa/fechar); só existe no caixa fechado.
  valorFundoCaixaFechamento?: number | null;
  saldoAtual?: number;
  status?: number;
};

export type TurnoFormaPagamento = {
  formaPagamento: FormaPagamentoId;
  descricao?: string | null;
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
  // Dinheiro na gaveta no início do turno (no primeiro turno, o fundo do caixa). Nunca entra nos totais.
  valorFundoCaixa: number;
  status: number;
  // Soma do esperado das formas de pagamento, sem o fundo.
  saldoCaixa: number;
  // Totais do turno aberto (GET /Caixa/turno); a lista de turnos traz só totalSaida.
  totalEntradas: number | null;
  totalSaidas: number | null;
  totalSaida: number | null;
  // Só no turno fechado.
  saldoCaixaInformado: number | null;
  totalDiferenca: number | null;
  observacao: string | null;
  // Dinheiro esperado na gaveta menos o fundo do caixa, que sempre fica lá.
  disponivelSangria: number | null;
  formasPagamento: TurnoFormaPagamento[];
};

export type Conferencia = {
  formaPagamento: FormaPagamentoId;
  valorInformado: number;
};

export type PassagemTurnoInput = {
  conferencias: Conferencia[];
  // Dinheiro que fica na gaveta para o novo turno; null faz a API assumir o fundo do turno encerrado mais o dinheiro conferido.
  valorFundoCaixa: number | null;
  observacao?: string;
};

export type FecharCaixaInput = {
  conferencias: Conferencia[];
  // Fundo contado na gaveta no fechamento (opcional, não negativo).
  valorFundoCaixa?: number | null;
  observacao?: string;
};

export type TipoMovimento = "entrada" | "saida" | "sangria";

// Linha do extrato (GET /Caixa/movimentos e /Caixa/historico/{caixaId}/movimentos).
export type Movimento = {
  movimentoId: number;
  dataHora: string;
  tipo: TipoMovimento;
  valor: number;
  formaPagamento: FormaPagamentoId | null;
  turnoId: number | null;
  usuario: string;
  motivo: string | null;
};

// Caixa já fechado, como o histórico o devolve; totais do fechamento conforme a resposta real.
export type CaixaFechado = Caixa & {
  abriu: string;
  fechou: string;
};

