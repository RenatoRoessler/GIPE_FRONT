import type { ModeloVeiculo, PlacaConsulta } from "@/types/veiculo";
import { api } from "../client";

export async function consultarPlaca(placa: string, signal?: AbortSignal): Promise<PlacaConsulta> {
  const { data } = await api.get<PlacaConsulta>(`/Veiculo/${encodeURIComponent(placa)}`, { signal });
  return data;
}

export async function listModelos(nome: string, signal?: AbortSignal): Promise<ModeloVeiculo[]> {
  const { data } = await api.get<ModeloVeiculo[]>("/Veiculo/modelos", { params: { nome }, signal });
  return data ?? [];
}
