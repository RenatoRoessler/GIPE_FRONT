import { normalizeDocumento } from "@/lib/documento";
import type { Paginado } from "@/lib/api/types";
import type { Mensalista, MensalistaFormValues, MensalistaTipo, TipoFormValues } from "@/types/mensalista";
import { api } from "../client";
import {
  fromMensalistaResponse,
  fromTipoResponse,
  toMensalistaPayload,
  toTipoPayload,
} from "./mensalista.mapper";

export async function listMensalistas(params: {
  pagina: number;
  tamanhoPagina: number;
  documento?: string;
}): Promise<Paginado<Mensalista>> {
  const documento = params.documento ? normalizeDocumento(params.documento) : "";
  const { data } = await api.get<Paginado<Partial<Mensalista>>>("/Mensalista", {
    params: {
      pagina: params.pagina,
      tamanhoPagina: params.tamanhoPagina,
      // Sem máscara; vazio não é enviado.
      ...(documento ? { documento } : {}),
    },
  });
  return { ...data, items: (data.items ?? []).map(fromMensalistaResponse) };
}

export async function createMensalista(values: MensalistaFormValues): Promise<{ mensalistaId: number }> {
  const { data } = await api.post<{ mensalistaId: number }>("/Mensalista", toMensalistaPayload(values));
  return data;
}

export async function updateMensalista(id: number, values: MensalistaFormValues): Promise<void> {
  await api.put(`/Mensalista/${id}`, toMensalistaPayload(values));
}

export async function listTiposMensalidade(): Promise<MensalistaTipo[]> {
  const { data } = await api.get<Partial<MensalistaTipo>[]>("/Mensalista/tipo");
  return (data ?? []).map(fromTipoResponse);
}

export async function createTipoMensalidade(values: TipoFormValues): Promise<{ mensalistaTipoId: number }> {
  const { data } = await api.post<{ mensalistaTipoId: number }>("/Mensalista/tipo", toTipoPayload(values));
  return data;
}

export async function updateTipoMensalidade(id: number, values: TipoFormValues): Promise<void> {
  await api.put(`/Mensalista/tipo/${id}`, toTipoPayload(values));
}
