import { onlyDigits } from "@/lib/digits";
import type {
  CpfConsulta,
  NovoUsuarioPayload,
  NovoUsuarioResultado,
  NovoUsuarioValues,
  PerfilEstacionamento,
  Usuario,
} from "@/types/usuario";

export function fromUsuarioResponse(dto: Partial<Usuario>): Usuario {
  return {
    usuarioId: dto.usuarioId ?? 0,
    cpf: onlyDigits(dto.cpf ?? ""),
    nome: dto.nome ?? "",
    email: dto.email ?? "",
    celular: onlyDigits(dto.celular ?? ""),
    perfil: dto.perfil ?? 0,
    perfilDescricao: dto.perfilDescricao ?? "",
    ativo: dto.ativo ?? false,
    trocarSenha: dto.trocarSenha ?? false,
    dataCriacao: dto.dataCriacao ?? "",
  };
}

export function fromCpfConsultaResponse(dto: Partial<CpfConsulta>): CpfConsulta {
  return {
    encontrado: dto.encontrado ?? false,
    cpf: onlyDigits(dto.cpf ?? ""),
    usuarioId: dto.usuarioId ?? null,
    nome: dto.nome ?? "",
    email: dto.email ?? "",
    celular: onlyDigits(dto.celular ?? ""),
    vinculadoNaEmpresa: dto.vinculadoNaEmpresa ?? false,
  };
}

export function fromNovoUsuarioResponse(dto: Partial<NovoUsuarioResultado>): NovoUsuarioResultado {
  return { usuarioId: dto.usuarioId ?? 0, novoCadastro: dto.novoCadastro ?? false };
}

export function toNovoUsuarioPayload(values: NovoUsuarioValues): NovoUsuarioPayload {
  return {
    cpf: onlyDigits(values.cpf),
    nome: values.nome.trim(),
    email: values.email.trim(),
    celular: onlyDigits(values.celular),
    perfil: Number(values.perfil) as PerfilEstacionamento,
  };
}
