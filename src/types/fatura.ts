import type { FormaPagamentoId } from "@/types/caixa";

// Situação da fatura em /api/v1/Fatura.
export const SITUACAO_FATURA = {
  Aberta: 1,
  Paga: 2,
  Cancelada: 3,
} as const;

export type SituacaoFatura = (typeof SITUACAO_FATURA)[keyof typeof SITUACAO_FATURA];

// GET /Fatura (itens da lista) e o campo `fatura` do POST e do GET /Fatura/{id}.
export type Fatura = {
  convenioFaturaId: number;
  empresaConveniadaId: number;
  conveniada: string;
  quantidadeSaidas: number;
  // Soma do valor da conveniada das saídas da fatura.
  valorTotal: number;
  // AAAA-MM-DD.
  vencimento: string;
  // number para tolerar valor novo do back; SITUACAO_FATURA nomeia os conhecidos.
  situacao: number;
  observacao: string | null;
  // Quem emitiu.
  usuario: string | null;
  // ISO sem fuso.
  dataCriacao: string;
  dataPagamento: string | null;
  formaPagamento: FormaPagamentoId | null;
  valorPago: number | null;
  usuarioPagamento: string | null;
  dataCancelamento: string | null;
  usuarioCancelamento: string | null;
};

// Saída incluída na fatura.
export type FaturaItem = {
  patioConvenioId: number;
  placa: string;
  modelo: string | null;
  categoria: number;
  dataEntrada: string;
  dataSaida: string;
  minutosPermanencia: number;
  // Tabela de convênio usada.
  rotatividade: string | null;
  percentualConveniada: number | null;
  valorFixoConveniada: number | null;
  valorTotal: number;
  valorConveniada: number;
  valorCliente: number;
};

// A lista e a resposta do cancelamento trazem `itens` vazio.
export type FaturaDetalhe = { fatura: Fatura; itens: FaturaItem[] };

export type FaturaFiltros = {
  empresaConveniadaId: number | null;
  situacao: SituacaoFatura | null;
  pagina: number;
};

// Valores dos formulários, como digitados.
export type EmitirFaturaValues = { empresaConveniadaId: string; vencimento: string; observacao: string };
export type PagarFaturaValues = { formaPagamento: string; valorPago: string; dataPagamento: string };

// Corpo do POST /Fatura.
export type EmitirFaturaPayload = { empresaConveniadaId: number; vencimento: string; observacao?: string };

// Corpo do pagamento. Sem valorPago, vale o total; sem dataPagamento, vale agora.
export type PagarFaturaPayload = { formaPagamento: number; valorPago?: number; dataPagamento?: string };
