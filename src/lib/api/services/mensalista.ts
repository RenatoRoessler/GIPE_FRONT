import { normalizeDocumento } from "@/lib/documento";
import type { Paginado } from "@/lib/api/types";
import {
  CONTRATO_STATUS,
  type ContratoMensalista,
  type ContratoStatus,
  type Mensalista,
  type MensalistaFormValues,
  type MensalistaTipo,
  type TipoFormValues,
} from "@/types/mensalista";
import { api } from "../client";
import { ApiError } from "../errors";
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

function toContratoStatus(value: unknown): ContratoStatus {
  return value === CONTRATO_STATUS.Aceito || value === CONTRATO_STATUS.Cancelado ? value : CONTRATO_STATUS.Pendente;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

// Contrato mais recente do mensalista. 404 = o mensalista não tem contrato (ex.: cadastrado antes do contrato existir).
export async function getContratoMensalista(id: number): Promise<ContratoMensalista | null> {
  try {
    const { data } = await api.get<Record<string, unknown>>(`/Mensalista/${id}/contrato`);
    return {
      status: toContratoStatus(data.status),
      versao: String(data.versao ?? ""),
      titulo: String(data.titulo ?? ""),
      dataGeracao: textOrNull(data.dataGeracao),
      tokenExpiracao: textOrNull(data.tokenExpiracao),
      dataAceite: textOrNull(data.dataAceite),
    };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return null;
    }
    throw error;
  }
}

// O link anterior deixa de funcionar. Sem contrato (ou cancelado) o back gera um novo. 400 se já foi aceito.
export async function reenviarContrato(id: number): Promise<{ tokenExpiracao: string | null; email: string }> {
  const { data } = await api.post<Record<string, unknown>>(`/Mensalista/${id}/contrato/reenviar`);
  return { tokenExpiracao: textOrNull(data?.tokenExpiracao), email: String(data?.email ?? "") };
}
