import type {
  Caixa,
  CaixaFechado,
  FecharCaixaInput,
  Movimento,
  PassagemTurnoInput,
  Turno,
  TurnoFormaPagamento,
} from "@/types/caixa";
import { api } from "../client";
import { ApiError } from "../errors";
import type { Paginado } from "../types";
import {
  fromCaixaFechadoResponse,
  fromMovimentoResponse,
  type CaixaFechadoDto,
  type MovimentoDto,
} from "./caixa.mapper";

// "Não há caixa/turno aberto" é um estado esperado da tela, não uma falha.
function nullIfNotFound(error: unknown): null {
  if (error instanceof ApiError && error.kind === "not_found") {
    return null;
  }
  throw error;
}

// Aceita os nomes antigos (valorInicial, totalEsperado, totalInformado) enquanto a API não for conferida de novo.
type TurnoDto = Omit<Partial<Turno>, "formasPagamento"> & {
  formasPagamento?: (Partial<TurnoFormaPagamento> & { formaPagamento: number })[] | null;
  valorInicial?: number; totalEsperado?: number; totalInformado?: number | null };

// GET /Caixa/turno traz por forma só entradas e saídas; o esperado (entradas menos saídas) vem na lista de turnos.
// Campo ausente nunca pode chegar como undefined: viraria NaN nas somas e nos valores em reais da tela.
function normalizeForma(forma: Partial<TurnoFormaPagamento> & { formaPagamento: number }): TurnoFormaPagamento {
  const entradas = forma.entradas ?? 0;
  const saidas = forma.saidas ?? 0;
  return {
    ...forma,
    entradas,
    saidas,
    valorEsperado: forma.valorEsperado ?? entradas - saidas,
    valorInformado: forma.valorInformado ?? null,
    diferenca: forma.diferenca ?? null,
  };
}

type TurnoDtoForma = Partial<TurnoFormaPagamento> & { formaPagamento: number };

function normalizeTurno(dto: Omit<TurnoDto, "formasPagamento"> & { formasPagamento?: TurnoDtoForma[] | null }): Turno {
  const { valorInicial, totalEsperado, totalInformado, ...resto } = dto;
  const formas = (dto.formasPagamento ?? []).map(normalizeForma);
  const somaEsperado = formas.reduce((soma, forma) => soma + forma.valorEsperado, 0);
  return {
    ...(resto as Turno),
    valorFundoCaixa: dto.valorFundoCaixa ?? valorInicial ?? 0,
    saldoCaixa: dto.saldoCaixa ?? totalEsperado ?? somaEsperado,
    saldoCaixaInformado: dto.saldoCaixaInformado ?? totalInformado ?? null,
    totalEntradas: dto.totalEntradas ?? null,
    totalSaidas: dto.totalSaidas ?? null,
    totalSaida: dto.totalSaida ?? null,
    totalDiferenca: dto.totalDiferenca ?? null,
    observacao: dto.observacao ?? null,
    disponivelSangria: dto.disponivelSangria ?? null,
    dataHoraFim: dto.dataHoraFim ?? null,
    usuarioIdFechamento: dto.usuarioIdFechamento ?? null,
    formasPagamento: formas,
  };
}

export async function getCaixa(): Promise<Caixa | null> {
  try {
    const { data } = await api.get<Partial<Caixa> & { caixaId: number; dataHoraAbertura: string }>("/Caixa");
    return { ...data, valorFundoCaixa: data.valorFundoCaixa ?? 0, valorTotalEntrada: data.valorTotalEntrada ?? null, valorTotalSaida: data.valorTotalSaida ?? null };
  } catch (error) {
    return nullIfNotFound(error);
  }
}

export async function getTurnoAtual(): Promise<Turno | null> {
  try {
    const { data } = await api.get<TurnoDto>("/Caixa/turno");
    return normalizeTurno(data);
  } catch (error) {
    return nullIfNotFound(error);
  }
}

// Do turno mais antigo para o mais recente (ordem da API).
export async function listTurnos(): Promise<Turno[]> {
  const { data } = await api.get<TurnoDto[]>("/Caixa/turnos");
  return (data ?? []).map(normalizeTurno);
}

export async function abrirCaixa(valorFundoCaixa: number): Promise<void> {
  await api.post("/Caixa/abrir", { valorFundoCaixa });
}

export async function registrarSangria(input: { valor: number; observacao: string }): Promise<void> {
  await api.post("/Caixa/sangria", input);
}

export async function passarTurno(input: PassagemTurnoInput): Promise<void> {
  await api.post("/Caixa/turno/passagem", input);
}

// Fecha o turno aberto e o caixa numa operação só; devolve o resumo do turno encerrado.
// No dinheiro a conferência vai sem o fundo; o fundo contado na gaveta vai em `valorFundoCaixa` (opcional).
export async function fecharCaixa({ conferencias, valorFundoCaixa, observacao }: FecharCaixaInput): Promise<Turno> {
  const { data } = await api.put<TurnoDto>("/Caixa/fechar", {
    conferencias,
    valorFundoCaixa: valorFundoCaixa ?? null,
    observacao,
  });
  return normalizeTurno(data);
}

// Entradas, saídas e sangrias do caixa aberto, do mais recente para o mais antigo. Sem caixa aberto, lista vazia.
export async function listMovimentos(): Promise<Movimento[]> {
  try {
    const { data } = await api.get<MovimentoDto[]>("/Caixa/movimentos");
    return (data ?? []).map(fromMovimentoResponse);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return [];
    }
    throw error;
  }
}

export type HistoricoParams = {
  // yyyy-MM-dd; filtram pelo dia da abertura do caixa, os dois dias inclusos.
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  tamanhoPagina?: number;
};

// Caixas já fechados, do mais recente para o mais antigo. Só Administrador e Gerente.
export async function listHistoricoCaixas(params: HistoricoParams = {}): Promise<Paginado<CaixaFechado>> {
  const { dataInicio, dataFim, pagina = 1, tamanhoPagina = 20 } = params;
  const { data } = await api.get<Paginado<CaixaFechadoDto>>("/Caixa/historico", {
    params: {
      pagina,
      tamanhoPagina,
      // Vazio não é enviado.
      ...(dataInicio ? { dataInicio } : {}),
      ...(dataFim ? { dataFim } : {}),
    },
  });
  return {
    page: data.page ?? pagina,
    pageSize: data.pageSize ?? tamanhoPagina,
    totalRecords: data.totalRecords ?? 0,
    totalPages: data.totalPages ?? 0,
    items: (data.items ?? []).map(fromCaixaFechadoResponse),
  };
}

// Extrato de um caixa já fechado (400 se o caixa ainda está aberto; 404 se não existe).
export async function listMovimentosCaixa(caixaId: number): Promise<Movimento[]> {
  const { data } = await api.get<MovimentoDto[]>(`/Caixa/historico/${caixaId}/movimentos`);
  return (data ?? []).map(fromMovimentoResponse);
}
