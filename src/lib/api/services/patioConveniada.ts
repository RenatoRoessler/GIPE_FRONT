import { isValidPlaca, normalizePlaca } from "@/lib/placa";
import type { VeiculoConveniada } from "@/types/patioConveniada";
import { api } from "../client";
import { fromPatioConveniadaResponse } from "./patioConveniada.mapper";

// Veículos carimbados pela conveniada logada que ainda não saíram, de todos os estacionamentos com convênio, do carimbo
// mais recente para o mais antigo. O back recusa placa inválida (400): só uma placa completa e válida vai na consulta.
export async function listarPatioConveniada(placa?: string): Promise<VeiculoConveniada[]> {
  const normalizada = placa ? normalizePlaca(placa) : "";
  const params = isValidPlaca(normalizada) ? { placa: normalizada } : undefined;
  const { data } = await api.get<unknown>("/Convenio/patio", { params });
  return fromPatioConveniadaResponse(data);
}
