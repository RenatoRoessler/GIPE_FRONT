import type { PlanoAdesao } from "@/types/plano";
import { api } from "../client";
import { ApiError } from "../errors";
import { fromPlanoResponse, planoDtoSchema } from "./plano.mapper";

// Endpoint público. Item que não passa na validação é descartado para não derrubar os demais;
// sem nenhum plano utilizável a consulta falha, e a tela mostra o estado de erro.
export async function listPlanos(signal?: AbortSignal): Promise<PlanoAdesao[]> {
  const { data } = await api.get<unknown>("/Plano", { signal });

  const itens = Array.isArray(data) ? data : [];
  const planos = itens.flatMap((item) => {
    const dto = planoDtoSchema.safeParse(item);
    return dto.success ? [dto.data] : [];
  });

  if (planos.length === 0) throw new ApiError("unknown");

  return planos.sort((a, b) => a.ordemExibicao - b.ordemExibicao).map(fromPlanoResponse);
}
