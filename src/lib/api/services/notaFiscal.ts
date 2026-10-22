import { normalizeDocumento } from "@/lib/documento";
import { formatDataApi } from "@/lib/periodoNotas";
import type { NotaFiscal, NotaSolicitada, PeriodoNotas, SolicitarNotaPayload } from "@/types/notaFiscal";
import { api } from "../client";

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() !== "" ? valor : null;
}

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

// Leitura tolerante: o contrato das listas ainda não foi confirmado. Campo ausente vira nulo, nunca "null" em texto.
export function fromNotaResponse(dto: Record<string, unknown>): NotaFiscal {
  return {
    notaFiscalId: numero(dto.notaFiscalId),
    valor: numero(dto.valor),
    dataSolicitacao: texto(dto.dataSolicitacao),
    dataLancamento: texto(dto.dataLancamento),
    documento: texto(dto.documento),
    email: texto(dto.email),
    placa: texto(dto.placa),
  };
}

// A resposta pode ser a lista direta ou um envelope com a lista dentro.
function paraLista(data: unknown): Record<string, unknown>[] {
  const itens = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? ((data as Record<string, unknown>).itens ?? (data as Record<string, unknown>).items ?? (data as Record<string, unknown>).data)
      : [];
  return Array.isArray(itens) ? itens.filter((item): item is Record<string, unknown> => !!item && typeof item === "object") : [];
}

// Solicitações dos clientes ainda sem lançamento pela empresa. Exige login.
export async function listNotasPendentes(): Promise<NotaFiscal[]> {
  const { data } = await api.get<unknown>("/nota-fiscal/pendentes");
  return paraLista(data).map(fromNotaResponse);
}

// Notas já lançadas no período. As datas vão como no contrato ("2026/10/01"). Exige login.
export async function listNotasLancadas(periodo: PeriodoNotas): Promise<NotaFiscal[]> {
  const { data } = await api.get<unknown>("/nota-fiscal/lancadas", {
    params: { dataInicio: formatDataApi(periodo.de), dataFim: formatDataApi(periodo.ate) },
  });
  return paraLista(data).map(fromNotaResponse);
}

// Corpo do POST: o documento só vai quando informado e só com os seus caracteres, sem máscara.
export function toSolicitarPayload(input: { token: string; documento: string; email: string; valor: number }): SolicitarNotaPayload {
  const documento = normalizeDocumento(input.documento);
  return {
    token: input.token,
    ...(documento !== "" && { documento }),
    email: input.email.trim(),
    valor: Math.round(input.valor * 100) / 100,
  };
}

// Público (sem login): o cliente pede a nota de uma saída paga; a solicitação fica pendente de lançamento na empresa.
export async function solicitarNotaFiscal(input: { token: string; documento: string; email: string; valor: number }): Promise<NotaSolicitada> {
  const { data } = await api.post<NotaSolicitada>("/nota-fiscal/cliente/solicitar", toSolicitarPayload(input));
  return data;
}
