import { getToken } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";

export type SessaoIds = { empresaId: number; usuarioId: number };

// O token não traz o código numérico da empresa e do usuário: nada foi enviado à API.
export class SessaoSemIdsError extends ApiError {
  constructor() {
    super("unauthorized", "A sessão não traz o código da empresa e do usuário.");
    this.name = "SessaoSemIdsError";
  }
}

// [A CONFIRMAR] Nomes das claims do JWT que trazem os ids numéricos. A primeira inteira e positiva vale.
const EMPRESA_ID_CLAIMS = ["empresa_id", "empresaId", "EmpresaId"] as const;
// A claim `nameidentifier` do .NET chega com o nome longo do esquema da Microsoft.
const NAME_IDENTIFIER = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const USUARIO_ID_CLAIMS = ["usuario_id", "usuarioId", "UsuarioId", NAME_IDENTIFIER, "nameid", "sub"] as const;

function decodePayload(token: string): Record<string, unknown> | null {
  const segment = token.split(".")[1];
  if (!segment) {
    return null;
  }
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function positiveInt(value: unknown): number | null {
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof number === "number" && Number.isSafeInteger(number) && number > 0 ? number : null;
}

function firstId(payload: Record<string, unknown>, claims: readonly string[]): number | null {
  for (const claim of claims) {
    const id = positiveInt(payload[claim]);
    if (id !== null) {
      return id;
    }
  }
  return null;
}

// Só leitura do que já está no cookie do próprio usuário: a assinatura não é verificada aqui. Quem garante que a
// empresa e o usuário pertencem à sessão é o back. Nunca loga o token nem as claims.
export function getSessaoIds(): SessaoIds | null {
  const token = getToken();
  if (!token) {
    return null;
  }
  const payload = decodePayload(token);
  if (!payload) {
    return null;
  }
  const empresaId = firstId(payload, EMPRESA_ID_CLAIMS);
  const usuarioId = firstId(payload, USUARIO_ID_CLAIMS);
  return empresaId !== null && usuarioId !== null ? { empresaId, usuarioId } : null;
}
