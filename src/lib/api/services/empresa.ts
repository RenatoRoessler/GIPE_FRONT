import type { EmpresaFormValues } from "@/types/empresa";
import { api } from "../client";
import { ApiError } from "../errors";
import { EmpresaDto, fromEmpresaResponse, toEmpresaPayload } from "./empresa.mapper";

// A empresa é identificada pelo token; ambos rejeitam com ApiError.
export async function getEmpresa(): Promise<EmpresaFormValues> {
  const { data } = await api.get<Partial<EmpresaDto>>("/Empresa");
  return fromEmpresaResponse(data);
}

export async function updateEmpresa(values: EmpresaFormValues): Promise<void> {
  await api.put("/Empresa", toEmpresaPayload(values));
}

// Adiciona uma nova empresa à conta do usuário logado (só Administrador). O corpo é o mesmo da edição, sem o troco
// padrão: ausente, a API o trata como zero. Responde 200 ou 201 com { empresaGuid }; o acesso à nova empresa é pelo
// login com escolha de empresa. Erros (400 de regra de negócio, 403, rede) sobem como ApiError.
export async function addEmpresa(values: EmpresaFormValues): Promise<{ empresaGuid: string }> {
  const { data } = await api.post<{ empresaGuid?: unknown }>("/Empresa/adicionar", toEmpresaPayload(values));
  const empresaGuid = typeof data?.empresaGuid === "string" ? data.empresaGuid.trim() : "";
  if (!empresaGuid) {
    throw new ApiError("unknown");
  }
  return { empresaGuid };
}
