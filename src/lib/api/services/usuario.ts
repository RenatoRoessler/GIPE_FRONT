import { onlyDigits } from "@/lib/digits";
import type {
  AlterarSenhaPayload,
  CpfConsulta,
  NovoUsuarioResultado,
  NovoUsuarioValues,
  Usuario,
} from "@/types/usuario";
import { api } from "../client";
import {
  fromCpfConsultaResponse,
  fromNovoUsuarioResponse,
  fromUsuarioResponse,
  toNovoUsuarioPayload,
} from "./usuario.mapper";

// O back devolve a lista inteira, sem paginação.
export async function listUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Partial<Usuario>[]>("/Usuario");
  return (data ?? []).map(fromUsuarioResponse);
}

export async function consultarCpf(cpf: string): Promise<CpfConsulta> {
  const { data } = await api.get<Partial<CpfConsulta>>(`/Usuario/cpf/${onlyDigits(cpf)}`);
  return fromCpfConsultaResponse(data ?? {});
}

// CPF novo cria o usuário com senha temporária; CPF existente só dá acesso a esta empresa.
export async function createUsuario(values: NovoUsuarioValues): Promise<NovoUsuarioResultado> {
  const { data } = await api.post<Partial<NovoUsuarioResultado>>("/Usuario", toNovoUsuarioPayload(values));
  return fromNovoUsuarioResponse(data ?? {});
}

export async function updatePerfil(id: number, perfil: number): Promise<void> {
  await api.put(`/Usuario/${id}/perfil`, { perfil });
}

export async function updateAtivo(id: number, ativo: boolean): Promise<void> {
  await api.put(`/Usuario/${id}/ativo`, { ativo });
}

// Rejeita com ApiError. A senha nunca é logada.
// `bearerToken` é o passwordChangeToken do primeiro acesso: o usuário ainda não tem sessão e o token de troca faz o
// papel dela nesta chamada. Sem ele vale a sessão do cookie. Com o token, quem chama limpa antes o cookie de sessão,
// que o interceptor do `api` usaria no lugar dele.
export async function alterarSenha(payload: AlterarSenhaPayload, options: { bearerToken?: string } = {}): Promise<void> {
  await api.put(
    "/Usuario/senha",
    { senhaAtual: payload.senhaAtual, novaSenha: payload.novaSenha },
    options.bearerToken ? { headers: { Authorization: `Bearer ${options.bearerToken}` } } : undefined,
  );
}
