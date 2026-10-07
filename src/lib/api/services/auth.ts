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
