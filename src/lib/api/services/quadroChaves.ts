import type { ChaveEscolhida, LinhaQuadroPayload, QuadroChaves, QuadroChavesPayload } from "@/types/quadroChaves";
import { api } from "../client";
import { fromChaveEscolhidaResponse, fromQuadroResponse, fromQuadrosResponse } from "./quadroChaves.mapper";

// Quadros ativos da empresa; o back devolve a lista inteira, sem paginação.
export async function listQuadros(): Promise<QuadroChaves[]> {
  const { data } = await api.get<unknown>("/Patio/quadro-chaves");
  return fromQuadrosResponse(data);
}

// Nome vazio, maior que 100 caracteres ou já usado sobem como ApiError de validação.
export async function criarQuadro(payload: QuadroChavesPayload): Promise<QuadroChaves | null> {
  const { data } = await api.post<unknown>("/Patio/quadro-chaves", payload);
  return fromQuadroResponse(data);
}

// Posições que já existem no quadro são ignoradas pelo back; devolve o quadro completo.
export async function acrescentarPosicoes(
  patioQuadroId: number,
  linhas: LinhaQuadroPayload[],
): Promise<QuadroChaves | null> {
  const { data } = await api.post<unknown>(`/Patio/quadro-chaves/${patioQuadroId}`, linhas);
  return fromQuadroResponse(data);
}

// Uma posição ocupada por outro veículo sobe como ApiError de validação, com a placa que a ocupa na mensagem.
export async function escolherQuadroChave(idPatio: number, patioQuadroChaveId: number): Promise<ChaveEscolhida> {
  const { data } = await api.put<unknown>(`/Patio/${idPatio}/quadro-chave`, { patioQuadroChaveId });
  return fromChaveEscolhidaResponse(data);
}

// Só exclui se nenhum veículo no pátio estiver com a chave nessa posição.
export async function excluirPosicao(patioQuadroChaveId: number): Promise<void> {
  await api.delete(`/Patio/quadro-chaves/${patioQuadroChaveId}`);
}

// Só inativa se nenhum veículo no pátio estiver com chave numa posição do quadro.
export async function inativarQuadro(patioQuadroId: number): Promise<void> {
  await api.delete(`/Patio/quadro-chaves/quadro/${patioQuadroId}`);
}
