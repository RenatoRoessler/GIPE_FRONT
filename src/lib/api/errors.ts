import { isAxiosError } from "axios";
import type { ApiErrorBody } from "./types";

export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "server"
  | "network"
  | "timeout"
  | "unknown";

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  unauthorized: "Sessão expirada. Faça login novamente.",
  forbidden: "Você não tem permissão para realizar esta ação.",
  not_found: "Recurso não encontrado.",
  validation: "Os dados enviados são inválidos.",
  rate_limited: "Muitas tentativas. Aguarde um pouco e tente de novo.",
  server: "Erro no servidor. Tente novamente em instantes.",
  network: "Não foi possível conectar ao servidor.",
  timeout: "O servidor demorou para responder. Tente novamente.",
  unknown: "Ocorreu um erro inesperado.",
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly details?: ApiErrorBody["errors"];

  constructor(kind: ApiErrorKind, message?: string, status?: number, details?: ApiErrorBody["errors"]) {
    super(message ?? DEFAULT_MESSAGES[kind]);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "forbidden";
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

// Ordem: message -> detail -> errors[0].message -> erros[0].mensagem.
function messageFromBody(body: ApiErrorBody | undefined): string | undefined {
  if (!body) return undefined;
  const firstError = Array.isArray(body.errors) ? body.errors[0] : undefined;
  return (
    nonEmpty(body.message) ??
    nonEmpty(body.detail) ??
    nonEmpty(firstError?.message) ??
    nonEmpty(body.erros?.[0]?.mensagem)
  );
}

// Converte qualquer falha em ApiError, sem carregar config/headers do request (podem conter o token).
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiError("timeout");
    }
    if (!error.response) {
      return new ApiError("network");
    }

    const { status, data } = error.response;
    const body = typeof data === "object" && data !== null ? data : undefined;
    const kind = kindFromStatus(status);
    // Permissão negada tem sempre o mesmo texto no sistema, seja qual for a mensagem do back.
    return new ApiError(kind, kind === "forbidden" ? undefined : messageFromBody(body), status, body?.errors);
  }

  return new ApiError("unknown");
}
