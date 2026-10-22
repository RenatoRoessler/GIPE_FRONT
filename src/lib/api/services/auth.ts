import { z } from "zod";
import { onlyDigits } from "@/lib/digits";
import { api } from "../client";
import { ApiError } from "../errors";

// Resposta do backend: { authenticated, accessToken, expiresAt, requiresCompanySelection, requiresPasswordChange,
// passwordChangeToken, ... }. Sem accessToken e sem troca de senha exigida (ex.: seleção de empresa pendente, ainda
// não suportada) não há sessão a criar.
const sessaoSchema = z.object({ accessToken: z.string().min(1) });
const trocaSenhaSchema = z.object({
  requiresPasswordChange: z.literal(true),
  passwordChangeToken: z.string().min(1),
});

export type LoginResult =
  | { kind: "sessao"; token: string }
  // Primeiro acesso: o back não abre sessão; devolve só um token para trocar a senha temporária.
  // O passwordChangeToken autoriza `alterarSenha` (PUT /Usuario/senha) no lugar da sessão.
  | { kind: "trocar-senha"; passwordChangeToken: string };

function toLoginResult(body: unknown): LoginResult {
  const troca = trocaSenhaSchema.safeParse(body);
  if (troca.success) return { kind: "trocar-senha", passwordChangeToken: troca.data.passwordChangeToken };
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
