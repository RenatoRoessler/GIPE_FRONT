import { z } from "zod";
import { onlyDigits } from "@/lib/digits";
import { api } from "../client";
import { ApiError } from "../errors";

// Resposta do backend: { authenticated, accessToken, expiresAt, requiresCompanySelection, ... }.
// Sem accessToken (ex.: seleção de empresa pendente, ainda não suportada) não há sessão a criar.
const loginResponseSchema = z.object({ accessToken: z.string().min(1) });

function extractToken(body: unknown): string {
  const parsed = loginResponseSchema.safeParse(body);
  if (!parsed.success) throw new ApiError("unknown");
  return parsed.data.accessToken;
}

// Rejeita com ApiError. O 401 aqui significa credencial inválida, e não sessão expirada.
export async function login(cpf: string, senha: string): Promise<{ token: string }> {
  try {
    const { data } = await api.post<unknown>("/autenticacao/login", {
      login: onlyDigits(cpf),
      senha,
    });
    return { token: extractToken(data) };
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

const INVALID_LINK_KINDS = new Set(["validation", "not_found", "unauthorized", "forbidden"]);

// [A DEFINIR] com o backend: endpoint e campos da redefinição são uma suposição, concentrada aqui.
// Erros 4xx são tratados como link inválido/expirado (kind "validation"), mantendo a mensagem do backend.
export async function resetPassword({
  token,
  senha,
}: {
  token: string;
  senha: string;
}): Promise<void> {
  try {
    await api.post("/autenticacao/redefinir-senha", { token, novaSenha: senha });
  } catch (error) {
    if (error instanceof ApiError && INVALID_LINK_KINDS.has(error.kind)) {
      throw new ApiError("validation", error.message, error.status, error.details);
    }
    throw error;
  }
}
