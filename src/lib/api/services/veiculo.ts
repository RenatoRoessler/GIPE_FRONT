import type { ModeloVeiculo, PlacaConsulta } from "@/types/veiculo";
import { api } from "../client";

export async function consultarPlaca(placa: string, signal?: AbortSignal): Promise<PlacaConsulta> {
  const { data } = await api.get<PlacaConsulta>(`/Veiculo/${encodeURIComponent(placa)}`, { signal });
  return data;
}

// Sempre devolve a lista inteira de modelos; o filtro é feito no cliente.
export async function listModelos(signal?: AbortSignal): Promise<ModeloVeiculo[]> {
  const { data } = await api.get<ModeloVeiculo[]>("/Veiculo/modelos", { signal });
  return data ?? [];
}
