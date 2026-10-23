import { z } from "zod";
import { onlyDigits } from "@/lib/digits";
import type { EmpresaOpcao } from "@/types/auth";
import { api } from "../client";
import { ApiError } from "../errors";
import { fromEmpresasResponse } from "./auth.mapper";

// Resposta do backend: { authenticated, accessToken, expiresAt, requiresCompanySelection, preAuthToken, empresas,
// requiresPasswordChange, passwordChangeToken, ... }. Sem accessToken, sem troca de senha e sem escolha de empresa
// válida não há sessão a criar.
const sessaoSchema = z.object({ accessToken: z.string().min(1) });
const escolhaEmpresaSchema = z.object({
  requiresCompanySelection: z.literal(true),
  preAuthToken: z.string().min(1),
  empresas: z.unknown(),
});
const trocaSenhaSchema = z.object({
  requiresPasswordChange: z.literal(true),
  passwordChangeToken: z.string().min(1),
});

export type LoginResult =
  | { kind: "sessao"; token: string }
  // Primeiro acesso: o back não abre sessão; devolve só um token para trocar a senha temporária.
  // O passwordChangeToken é enviado a `trocarSenhaPrimeiroAcesso` (POST /autenticacao/trocar-senha).
  | { kind: "trocar-senha"; passwordChangeToken: string }
  // Usuário com mais de uma empresa: o back não abre sessão; devolve um token de pré-autenticação e a lista de empresas.
  // O preAuthToken é enviado a `selecionarEmpresa` (POST /autenticacao/selecionar-empresa).
  | { kind: "escolher-empresa"; preAuthToken: string; empresas: EmpresaOpcao[] };

function toLoginResult(body: unknown): LoginResult {
  const troca = trocaSenhaSchema.safeParse(body);
  if (troca.success) return { kind: "trocar-senha", passwordChangeToken: troca.data.passwordChangeToken };
  const escolha = escolhaEmpresaSchema.safeParse(body);
  if (escolha.success) {
    return { kind: "escolher-empresa", preAuthToken: escolha.data.preAuthToken, empresas: fromEmpresasResponse(escolha.data.empresas) };
  }
  const sessao = sessaoSchema.safeParse(body);
  if (sessao.success) return { kind: "sessao", token: sessao.data.accessToken };
  throw new ApiError("unknown");
}

// Rejeita com ApiError. O 401 aqui significa credencial inválida, e não sessão expirada.
export async function login(cpf: string, senha: string): Promise<LoginResult> {
  try {
    const { data } = await api.post<unknown>("/autenticacao/login", {
      login: onlyDigits(cpf),
      senha,
    });
    return toLoginResult(data);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthorized") {
      throw new ApiError("unauthorized", "CPF ou senha inválidos.", error.status, error.details);
    }
    throw error;
  }
}

// Solicita o e-mail de recuperação. Rejeita com ApiError.
// 404 significa e-mail não cadastrado e é exibido ao usuário. Rota pública: um 401 aqui nunca
// significa "sessão expirada".
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await api.post("/autenticacao/esqueci-senha", { email: email.trim() });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.kind === "not_found") {
        throw new ApiError("not_found", "E-mail não encontrado. Confira o endereço informado.", error.status);
      }
      if (error.kind === "unauthorized") throw new ApiError("server", undefined, error.status);
    }
    throw error;
  }
}

// Redefine a senha com o código do link. A confirmação de senha não é enviada.
// Rejeita com ApiError sem normalizar: o formulário decide pelo kind (401/403/404 = link inválido;
// 400/422 = mensagem do backend). O token e a senha nunca são logados.
export async function resetPassword({
  token,
  senha,
}: {
  token: string;
  senha: string;
}): Promise<void> {
  await api.post("/autenticacao/redefinir-senha", { token, novaSenha: senha });
}

// Troca a senha temporária do primeiro acesso (POST /autenticacao/trocar-senha). O passwordChangeToken vem do login
// e vai no header Authorization (Bearer), no lugar da sessão; o corpo leva só a nova senha.
// Rejeita com ApiError sem normalizar: o formulário decide pelo kind (401/403/404 = token vencido ou recusado).
// O token e a senha nunca são logados.
export async function trocarSenhaPrimeiroAcesso({
  passwordChangeToken,
  novaSenha,
}: {
  passwordChangeToken: string;
  novaSenha: string;
}): Promise<void> {
  await api.post(
    "/autenticacao/trocar-senha",
    { novaSenha },
    { headers: { Authorization: `Bearer ${passwordChangeToken}` } },
  );
}

// Conclui o login de quem tem mais de uma empresa: o preAuthToken do login vai no header Authorization (Bearer), no
// lugar da sessão, e o corpo leva só a empresa escolhida. Devolve o accessToken da empresa.
// Rejeita com ApiError: 401 é escolha vencida ou recusada. O token nunca é logado.
export async function selecionarEmpresa({
  preAuthToken,
  empresaGuid,
}: {
  preAuthToken: string;
  empresaGuid: string;
}): Promise<string> {
  try {
    const { data } = await api.post<unknown>(
      "/autenticacao/selecionar-empresa",
      { empresaGuid },
      { headers: { Authorization: `Bearer ${preAuthToken}` } },
    );
    const sessao = sessaoSchema.safeParse(data);
    if (!sessao.success) throw new ApiError("unknown");
    return sessao.data.accessToken;
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthorized") {
      throw new ApiError("unauthorized", "Sua escolha expirou. Entre novamente.", error.status, error.details);
    }
    throw error;
  }
}
