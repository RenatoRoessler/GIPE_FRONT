import type { Configuracao, ConfiguracaoValues } from "@/types/configuracao";
import { api } from "../client";
import { ConfiguracaoDto, fromConfiguracaoResponse, toConfiguracaoPayload } from "./configuracao.mapper";

// A empresa é identificada pelo token; ambos rejeitam com ApiError.
export async function getConfiguracao(): Promise<Configuracao> {
  const { data } = await api.get<Partial<ConfiguracaoDto>>("/Configuracao");
  return fromConfiguracaoResponse(data);
}

export async function updateConfiguracao(values: ConfiguracaoValues): Promise<void> {
  await api.put("/Configuracao", toConfiguracaoPayload(values));
}
