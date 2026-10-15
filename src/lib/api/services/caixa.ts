import type {
  Caixa,
  Conferencia,
  PassagemTurnoInput,
  Turno,
} from "@/types/caixa";
import { api } from "../client";
import { ApiError } from "../errors";

// "Não há caixa/turno aberto" é um estado esperado da tela, não uma falha.
function nullIfNotFound(error: unknown): null {
  if (error instanceof ApiError && error.kind === "not_found") {
    return null;
  }
  throw error;
}

function normalizeTurno(turno: Turno): Turno {
  return { ...turno, formasPagamento: turno.formasPagamento ?? [] };
}

export async function getCaixa(): Promise<Caixa | null> {
  try {
    const { data } = await api.get<Caixa>("/Caixa");
    return data;
  } catch (error) {
    return nullIfNotFound(error);
  }
}

export async function getTurnoAtual(): Promise<Turno | null> {
  try {
    const { data } = await api.get<Turno>("/Caixa/turno");
    return normalizeTurno(data);
  } catch (error) {
    return nullIfNotFound(error);
  }
}

// Do turno mais antigo para o mais recente (ordem da API).
export async function listTurnos(): Promise<Turno[]> {
  const { data } = await api.get<Turno[]>("/Caixa/turnos");
  return (data ?? []).map(normalizeTurno);
}

// [A DEFINIR] O corpo do POST /Caixa/abrir não consta no contrato recebido; assume `valorFundoCaixa`
// (mesmo nome do campo em GET /Caixa). Confirmar com o backend.
export async function abrirCaixa(valorFundoCaixa: number): Promise<void> {
  await api.post("/Caixa/abrir", { valorFundoCaixa });
}

export async function registrarSangria(input: { valor: number; observacao: string }): Promise<void> {
  await api.post("/Caixa/sangria", input);
}

export async function passarTurno(input: PassagemTurnoInput): Promise<void> {
  await api.post("/Caixa/turno/passagem", input);
}

// [A DEFINIR] Endpoint e corpo do fechamento não constam no contrato recebido; assume
// POST /Caixa/fechar com { conferencias, observacao } e o turno encerrado como retorno. Confirmar com o backend.
export async function fecharCaixa(conferencias: Conferencia[], observacao?: string): Promise<Turno> {
  const { data } = await api.post<Turno>("/Caixa/fechar", { conferencias, observacao });
  return normalizeTurno(data);
}
