import type { EmpresaOpcao } from "@/types/auth";
import { onlyDigits } from "@/lib/digits";
import { ApiError } from "../errors";

// Formato real de cada empresa no login (conferido na API em 23/10/2026):
// { empresaGuid, razaoSocial, cnpj, perfil: "Administrador", perfilId: 1 } (sem nomeFantasia). Os nomes alternativos
// abaixo são tolerância; todo ajuste de campo fica neste arquivo.
export type EmpresaOpcaoDto = {
  empresaGuid?: string | null;
  guid?: string | null;
  id?: string | null;
  nomeFantasia?: string | null;
  razaoSocial?: string | null;
  nome?: string | null;
  cnpj?: string | null;
  // A API manda o nome do perfil em `perfil` (texto) e o código em `perfilId`.
  perfil?: number | string | null;
  perfilId?: number | null;
  tipoUsuario?: number | null;
};

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function fromEmpresaOpcao(dto: EmpresaOpcaoDto): EmpresaOpcao {
  const id = texto(dto.empresaGuid) || texto(dto.guid) || texto(dto.id);
  const nome = texto(dto.nomeFantasia) || texto(dto.razaoSocial) || texto(dto.nome);
  if (!id || !nome) {
    throw new ApiError("unknown");
  }
  const codigo = dto.perfilId ?? (typeof dto.perfil === "number" ? dto.perfil : null) ?? dto.tipoUsuario ?? null;
  const descricao = typeof dto.perfil === "string" ? dto.perfil.trim() : "";
  return { id, nome, cnpj: onlyDigits(texto(dto.cnpj)), perfil: codigo, perfilDescricao: descricao || null };
}

// Lista vazia, que não é lista ou com item sem identificador ou sem nome vira erro: a tela nunca fica em branco.
export function fromEmpresasResponse(lista: unknown): EmpresaOpcao[] {
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new ApiError("unknown");
  }
  return lista.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new ApiError("unknown");
    }
    return fromEmpresaOpcao(item as EmpresaOpcaoDto);
  });
}
