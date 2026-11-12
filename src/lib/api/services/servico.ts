import type { ItemFila, Servico, ServicoPayload, ServicosDoVeiculo, StatusServico } from "@/types/servico";
import { api } from "../client";
import { fromFilaResponse, fromServicoResponse, fromServicosDoVeiculoResponse, fromServicosResponse } from "./servico.mapper";

const BASE = "/Servico";
const doPatio = (idPatio: number) => `/patio/${idPatio}/servico`;

// Serviços da empresa. Sem `ativo` vêm todos; `true` só os ativos e `false` só os inativos.
export async function listServicos(ativo?: boolean): Promise<Servico[]> {
  const { data } = await api.get<unknown>(BASE, ativo === undefined ? undefined : { params: { ativo } });
  return fromServicosResponse(data);
}

export async function getServico(id: number): Promise<Servico | null> {
  const { data } = await api.get<unknown>(`${BASE}/${id}`);
  return fromServicoResponse(data);
}

// Nome vazio ou já usado entre os ativos, sem preço ou com categoria repetida sobem como ApiError de validação.
export async function criarServico(payload: ServicoPayload): Promise<Servico | null> {
  const { data } = await api.post<unknown>(BASE, payload);
  return fromServicoResponse(data);
}

export async function atualizarServico(id: number, payload: ServicoPayload): Promise<Servico | null> {
  const { data } = await api.put<unknown>(`${BASE}/${id}`, payload);
  return fromServicoResponse(data);
}

// Não apaga: o serviço some da lista de ativos e os veículos que já o têm continuam com ele. A resposta pode vir sem corpo (204).
export async function inativarServico(id: number): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// Serviços não cancelados dos veículos no pátio. `status` (1, 2 ou 3) filtra um status só.
export async function listFila(status?: StatusServico): Promise<ItemFila[]> {
  const { data } = await api.get<unknown>(`${BASE}/fila`, status === undefined ? undefined : { params: { status } });
  return fromFilaResponse(data);
}

export async function listServicosDoVeiculo(idPatio: number, opcoes: { incluirCancelados?: boolean } = {}): Promise<ServicosDoVeiculo> {
  const { data } = await api.get<unknown>(doPatio(idPatio), opcoes.incluirCancelados ? { params: { incluirCancelados: true } } : undefined);
  return fromServicosDoVeiculoResponse(data);
}

// Exige os serviços ligados na configuração, serviço ativo com preço para a categoria do veículo e fora do veículo ainda.
export async function acrescentarServicos(idPatio: number, servicoIds: number[]): Promise<ServicosDoVeiculo> {
  const { data } = await api.post<unknown>(doPatio(idPatio), { servicoIds });
  return fromServicosDoVeiculoResponse(data);
}

// Só com o veículo no pátio; serviço cancelado não muda.
export async function atualizarStatusServico(idPatio: number, patioServicoId: number, status: StatusServico): Promise<void> {
  await api.put(`${doPatio(idPatio)}/${patioServicoId}/status`, { status });
}

// Só serviço Aguardando cancela. O motivo é obrigatório (até 200 caracteres) e a resposta traz os serviços do veículo.
export async function cancelarServico(idPatio: number, patioServicoId: number, motivo: string): Promise<ServicosDoVeiculo> {
  const { data } = await api.put<unknown>(`${doPatio(idPatio)}/${patioServicoId}/cancelar`, { motivo });
  return fromServicosDoVeiculoResponse(data);
}
