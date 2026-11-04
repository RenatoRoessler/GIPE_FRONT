import { normalizePlaca } from "@/lib/placa";
import type {
  Conferencia,
  ConferenciaResumo,
  EntradaConferenciaPayload,
  ItemConferencia,
  MetodoConferencia,
  OrigemLeitura,
  ResultadoLeitura,
  SaidaConferenciaPayload,
  SituacaoMarcacao,
} from "@/types/conferenciaPatio";
import type { SaidaRegistrada } from "@/types/saida";
import { api } from "../client";
import { fromConferenciaResponse, fromItemResponse, fromLeituraResponse, fromResumoResponse } from "./conferenciaPatio.mapper";

const BASE = "/conferencia-patio";

// O cliente HTTP entrega o 204 como corpo vazio; qualquer coisa que não seja um objeto vale como "sem corpo".
function comoObjeto(data: unknown): Record<string, unknown> | null {
  return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

function exigirObjeto(data: unknown): Record<string, unknown> {
  return comoObjeto(data) ?? {};
}

// Veículos no pátio agora, a última conferência e a que está em andamento. `caixaIdAberto` nulo: sem caixa aberto.
export async function obterResumo(): Promise<ConferenciaResumo> {
  const { data } = await api.get<unknown>(`${BASE}/resumo`);
  return fromResumoResponse(exigirObjeto(data));
}

// A conferência em andamento da empresa; 204 (nenhuma) vira `null`.
export async function obterAberta(): Promise<Conferencia | null> {
  const { data } = await api.get<unknown>(`${BASE}/aberta`);
  const raw = comoObjeto(data);
  return raw ? fromConferenciaResponse(raw) : null;
}

// Exige caixa aberto e só uma conferência aberta por empresa: os dois casos voltam como 400 (ApiError "validation").
export async function iniciarConferencia(metodo: MetodoConferencia): Promise<Conferencia> {
  const { data } = await api.post<unknown>(BASE, { metodo });
  return fromConferenciaResponse(exigirObjeto(data));
}

// Gravada na hora. A placa vai como veio: o back aceita com ou sem hífen, em maiúsculas ou minúsculas.
export async function lerPlaca(id: number, payload: { placa: string; origem: OrigemLeitura }): Promise<ResultadoLeitura> {
  const { data } = await api.post<unknown>(`${BASE}/${id}/leituras`, { placa: normalizePlaca(payload.placa), origem: payload.origem });
  return fromLeituraResponse(exigirObjeto(data));
}

// "Está no pátio", "Não achei", "Desfazer" e "Procurar de novo".
export async function marcarItem(id: number, itemId: number, situacao: SituacaoMarcacao): Promise<ItemConferencia> {
  const { data } = await api.put<unknown>(`${BASE}/${id}/itens/${itemId}`, { situacao });
  const item = fromItemResponse(exigirObjeto(data));
  if (item === null) {
    throw new Error("Resposta inesperada ao marcar o veículo.");
  }
  return item;
}

// Baixa normal do pátio: o valor vem de GET /Patio/saida. Devolve o mesmo que POST /Patio/{idPatio}/saida.
export async function darSaidaPeloItem(id: number, itemId: number, payload: SaidaConferenciaPayload): Promise<SaidaRegistrada> {
  const { data } = await api.post<SaidaRegistrada>(`${BASE}/${id}/itens/${itemId}/saida`, payload);
  return data;
}

// Mensalista só entra como mensalista se a placa puder; senão o back responde 400 com o motivo.
export async function registrarEntradaSemTicket(id: number, placa: string, payload: EntradaConferenciaPayload): Promise<unknown> {
  const { data } = await api.post<unknown>(`${BASE}/${id}/sem-entrada/${encodeURIComponent(normalizePlaca(placa))}/entrada`, payload);
  return data;
}

// Leitura errada: a placa deixa de ser divergência (volta a pendente se for lida de novo).
export async function descartarSemEntrada(id: number, placa: string): Promise<void> {
  await api.delete(`${BASE}/${id}/sem-entrada/${encodeURIComponent(normalizePlaca(placa))}`);
}

// Os pendentes ficam como "não encontrado". Pode finalizar com divergências.
export async function finalizarConferencia(id: number, observacao?: string): Promise<Conferencia> {
  const texto = observacao?.trim();
  const { data } = await api.post<unknown>(`${BASE}/${id}/finalizar`, texto ? { observacao: texto } : {});
  return fromConferenciaResponse(exigirObjeto(data));
}
