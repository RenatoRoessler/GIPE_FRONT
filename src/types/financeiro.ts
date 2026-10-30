import type { FormaPagamentoId } from "@/types/caixa";

// ETipoLancamentoFinanceiro do back.
export const TIPO_LANCAMENTO = { Entrada: 1, Saida: 2 } as const;
export type TipoLancamento = (typeof TIPO_LANCAMENTO)[keyof typeof TIPO_LANCAMENTO];

// EAgrupamentoFluxoCaixa do back.
export const AGRUPAMENTO_FLUXO = { Dia: 1, Mes: 2 } as const;
export type AgrupamentoFluxo = (typeof AGRUPAMENTO_FLUXO)[keyof typeof AGRUPAMENTO_FLUXO];

// Origem de cada valor do fluxo. Mantido como number para tolerar origens novas do back (a 4 é o movimento de caixa do financeiro, que o fluxo não conta).
export const ORIGEM_FLUXO = { Rotativo: 1, Mensalidades: 2, Lancamento: 3 } as const;
export type OrigemFluxo = number;

// GET /Financeiro/fluxo (confirmado). Valores em reais; datas AAAA-MM-DD.
export type FluxoCategoria = {
  origem: OrigemFluxo;
  tipo: TipoLancamento;
  financeiroCategoriaId: number | null;
  categoria: string;
  financeiroCategoriaPaiId: number | null;
  categoriaPai: string | null;
  valor: number;
};

export type FluxoPeriodo = {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
};

export type FluxoCaixa = {
  dataInicio: string;
  dataFim: string;
  agrupamento: AgrupamentoFluxo;
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  categorias: FluxoCategoria[];
  periodos: FluxoPeriodo[];
};

export type FluxoParams = { dataInicio: string; dataFim: string; agrupamento: AgrupamentoFluxo };

// GET /Financeiro/categoria. [A CONFIRMAR] os nomes da resposta (supostos a partir do corpo do POST e do fluxo).
export type FinanceiroCategoria = {
  financeiroCategoriaId: number;
  nome: string;
  tipo: TipoLancamento;
  financeiroCategoriaPaiId: number | null;
  categoriaPai: string | null;
  ativo: boolean;
};

// Corpo do POST e do PUT /Financeiro/categoria.
export type CategoriaPayload = {
  nome: string;
  tipo: TipoLancamento;
  financeiroCategoriaPaiId: number | null;
  ativo: boolean;
};

// GET /Financeiro/lancamento(/{id}). [A CONFIRMAR] os nomes da resposta.
export type Lancamento = {
  financeiroLancamentoId: number;
  financeiroCategoriaId: number;
  categoria: string;
  categoriaPai: string | null;
  // null quando a resposta não traz o tipo; a tela mostra o valor sem sinal nem cor de entrada ou saída.
  tipo: TipoLancamento | null;
  descricao: string;
  valor: number;
  // AAAA-MM-DD.
  dataPagamento: string;
  formaPagamento: FormaPagamentoId;
  favorecido: string | null;
  documento: string | null;
  observacao: string | null;
  peloCaixa: boolean;
  cancelado: boolean;
  canceladoPor: string | null;
};

// Corpo do POST e do PUT /Financeiro/lancamento (o PUT leva o corpo completo; peloCaixa é ignorado).
export type LancamentoPayload = {
  financeiroCategoriaId: number;
  descricao: string;
  valor: number;
  // null = hoje.
  dataPagamento: string | null;
  formaPagamento: FormaPagamentoId;
  favorecido: string | null;
  documento: string | null;
  observacao: string | null;
  peloCaixa: boolean;
};

export type LancamentoFiltros = {
  de?: string;
  ate?: string;
  tipo?: TipoLancamento;
  financeiroCategoriaId?: number;
  incluirCancelados: boolean;
  pagina: number;
};

// Valores dos formulários (strings, como os campos de texto).
export type LancamentoFormValues = {
  tipo: string;
  financeiroCategoriaId: string;
  descricao: string;
  // Texto monetário ("R$ 1.234,50").
  valor: string;
  // AAAA-MM-DD.
  dataPagamento: string;
  formaPagamento: string;
  favorecido: string;
  documento: string;
  observacao: string;
  peloCaixa: boolean;
};

export type CategoriaFormValues = {
  nome: string;
  tipo: string;
  financeiroCategoriaPaiId: string;
  ativo: boolean;
};
