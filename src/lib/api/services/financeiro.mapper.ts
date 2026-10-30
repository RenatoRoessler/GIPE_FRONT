import { parseMoney } from "@/lib/money";
import type { FormaPagamentoId } from "@/types/caixa";
import {
  AGRUPAMENTO_FLUXO,
  TIPO_LANCAMENTO,
  type AgrupamentoFluxo,
  type CategoriaFormValues,
  type CategoriaPayload,
  type FinanceiroCategoria,
  type FluxoCaixa,
  type FluxoCategoria,
  type FluxoPeriodo,
  type Lancamento,
  type LancamentoFormValues,
  type LancamentoPayload,
  type TipoLancamento,
} from "@/types/financeiro";

type Dto = Record<string, unknown>;

// Leitura tolerante: o back devolve valores em reais, mas campo ausente ou inválido nunca vira NaN na tela.
function numero(valor: unknown): number {
  const convertido = typeof valor === "number" ? valor : typeof valor === "string" && valor.trim() !== "" ? Number(valor) : Number.NaN;
  return Number.isFinite(convertido) ? convertido : 0;
}

function numeroOuNulo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

// Primeiro texto preenchido entre os nomes que o campo pode ter na resposta.
function primeiroTexto(dto: Dto, nomes: readonly string[]): string | null {
  for (const nome of nomes) {
    const valor = texto(dto[nome]);
    if (valor !== null) {
      return valor;
    }
  }
  return null;
}

// "2026-10-22T00:00:00" vira "2026-10-22".
function dia(valor: unknown): string {
  return typeof valor === "string" ? valor.slice(0, 10) : "";
}

function tipoLancamento(valor: unknown): TipoLancamento | null {
  return valor === TIPO_LANCAMENTO.Entrada || valor === TIPO_LANCAMENTO.Saida ? valor : null;
}

function agrupamento(valor: unknown): AgrupamentoFluxo {
  return valor === AGRUPAMENTO_FLUXO.Mes ? AGRUPAMENTO_FLUXO.Mes : AGRUPAMENTO_FLUXO.Dia;
}

function lista(valor: unknown): Dto[] {
  return Array.isArray(valor) ? valor.filter((item): item is Dto => !!item && typeof item === "object") : [];
}

function fromFluxoCategoria(dto: Dto): FluxoCategoria {
  return {
    origem: numero(dto.origem),
    // O back sempre manda o tipo; sem ele, a linha cai do lado das entradas, onde estão as duas origens automáticas.
    tipo: tipoLancamento(dto.tipo) ?? TIPO_LANCAMENTO.Entrada,
    financeiroCategoriaId: numeroOuNulo(dto.financeiroCategoriaId),
    categoria: texto(dto.categoria) ?? "",
    financeiroCategoriaPaiId: numeroOuNulo(dto.financeiroCategoriaPaiId),
    categoriaPai: texto(dto.categoriaPai),
    valor: numero(dto.valor),
  };
}

function fromFluxoPeriodo(dto: Dto): FluxoPeriodo {
  return {
    data: dia(dto.data),
    entradas: numero(dto.entradas),
    saidas: numero(dto.saidas),
    saldo: numero(dto.saldo),
    saldoAcumulado: numero(dto.saldoAcumulado),
  };
}

export function fromFluxoResponse(dto: Dto): FluxoCaixa {
  return {
    dataInicio: dia(dto.dataInicio),
    dataFim: dia(dto.dataFim),
    agrupamento: agrupamento(dto.agrupamento),
    totalEntradas: numero(dto.totalEntradas),
    totalSaidas: numero(dto.totalSaidas),
    saldo: numero(dto.saldo),
    categorias: lista(dto.categorias).map(fromFluxoCategoria),
    periodos: lista(dto.periodos).map(fromFluxoPeriodo),
  };
}

export function fromCategoriaResponse(dto: Dto): FinanceiroCategoria {
  return {
    financeiroCategoriaId: numero(dto.financeiroCategoriaId),
    nome: texto(dto.nome) ?? "",
    tipo: tipoLancamento(dto.tipo) ?? TIPO_LANCAMENTO.Entrada,
    financeiroCategoriaPaiId: numeroOuNulo(dto.financeiroCategoriaPaiId),
    categoriaPai: primeiroTexto(dto, ["categoriaPai", "nomeCategoriaPai"]),
    // Sem o campo, a categoria vale como ativa: esconder uma categoria por falta de dado seria pior.
    ativo: dto.ativo !== false,
  };
}

export function fromLancamentoResponse(dto: Dto): Lancamento {
  return {
    financeiroLancamentoId: numero(dto.financeiroLancamentoId),
    financeiroCategoriaId: numero(dto.financeiroCategoriaId),
    categoria: primeiroTexto(dto, ["categoria", "categoriaNome", "nomeCategoria"]) ?? "",
    categoriaPai: primeiroTexto(dto, ["categoriaPai", "nomeCategoriaPai"]),
    tipo: tipoLancamento(dto.tipo ?? dto.tipoLancamento),
    descricao: texto(dto.descricao) ?? "",
    // O corpo do POST leva o valor positivo; o sentido (entrada ou saída) é o tipo, então o valor é sempre lido sem sinal.
    valor: Math.abs(numero(dto.valor)),
    dataPagamento: dia(dto.dataPagamento),
    formaPagamento: numero(dto.formaPagamento),
    favorecido: texto(dto.favorecido),
    documento: texto(dto.documento),
    observacao: texto(dto.observacao),
    peloCaixa: dto.peloCaixa === true,
    cancelado: dto.cancelado === true,
    canceladoPor: primeiroTexto(dto, ["canceladoPor", "usuarioCancelamento", "nomeUsuarioCancelamento", "canceladoPorNome"]),
  };
}

function textoOuNulo(valor: string): string | null {
  const aparado = valor.trim();
  return aparado === "" ? null : aparado;
}

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

// `atual` só vem na edição. Lançamento feito pelo caixa não muda valor, data nem forma (o back recusa), mas o PUT leva o corpo completo:
// por isso esses três campos saem do lançamento atual, nunca do formulário.
export function toLancamentoPayload(values: LancamentoFormValues, atual?: Lancamento): LancamentoPayload {
  const travado = atual?.peloCaixa === true;
  const formaPagamento: FormaPagamentoId = travado ? atual.formaPagamento : Number(values.formaPagamento);
  return {
    financeiroCategoriaId: Number(values.financeiroCategoriaId),
    descricao: values.descricao.trim(),
    valor: travado ? atual.valor : arredondar(parseMoney(values.valor)),
    dataPagamento: travado ? atual.dataPagamento : values.dataPagamento === "" ? null : values.dataPagamento,
    formaPagamento,
    favorecido: textoOuNulo(values.favorecido),
    documento: textoOuNulo(values.documento),
    observacao: textoOuNulo(values.observacao),
    // Só vale no cadastro; na edição o back ignora.
    peloCaixa: atual ? atual.peloCaixa : values.peloCaixa,
  };
}

// `ativo` fixo no cadastro (a categoria nasce ativa); na edição vem do formulário.
export function toCategoriaPayload(values: CategoriaFormValues, ativo: boolean = values.ativo): CategoriaPayload {
  return {
    nome: values.nome.trim(),
    tipo: Number(values.tipo) as TipoLancamento,
    financeiroCategoriaPaiId: values.financeiroCategoriaPaiId === "" ? null : Number(values.financeiroCategoriaPaiId),
    ativo,
  };
}
