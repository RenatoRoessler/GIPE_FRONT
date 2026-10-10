import type { Paginado } from "@/lib/api/types";
import type { PrecoFormValues, PrecoView } from "@/types/preco";
import { api } from "../client";
import { fromPrecoResponse, toPrecoPayload, type PrecoDto } from "./preco.mapper";

export async function listPrecos(params: {
  pagina: number;
  tamanhoPagina: number;
}): Promise<Paginado<PrecoView>> {
  const { data } = await api.get<Paginado<Partial<PrecoDto>>>("/rotatividade", { params });
  return { ...data, items: (data.items ?? []).map(fromPrecoResponse) };
}

export async function createPreco(values: PrecoFormValues): Promise<void> {
  await api.post("/rotatividade", toPrecoPayload(values));
}
