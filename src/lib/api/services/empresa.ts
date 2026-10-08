import type { EmpresaFormValues } from "@/types/empresa";
import { api } from "../client";
import { EmpresaDto, fromEmpresaResponse, toEmpresaPayload } from "./empresa.mapper";

// A empresa é identificada pelo token; ambos rejeitam com ApiError.
export async function getEmpresa(): Promise<EmpresaFormValues> {
  const { data } = await api.get<Partial<EmpresaDto>>("/Empresa");
  return fromEmpresaResponse(data);
}

export async function updateEmpresa(values: EmpresaFormValues): Promise<void> {
  await api.put("/Empresa", toEmpresaPayload(values));
}
