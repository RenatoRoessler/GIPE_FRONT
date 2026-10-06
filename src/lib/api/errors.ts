import { isAxiosError } from "axios";
import type { ApiErrorBody } from "./types";

export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server"
  | "network"
  | "timeout"
  | "unknown";

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  unauthorized: "Sessão expirada. Faça login novamente.",
  forbidden: "Você não tem permissão para realizar esta ação.",
  not_found: "Recurso não encontrado.",
  validation: "Os dados enviados são inválidos.",
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

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
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
    const message = typeof body?.message === "string" && body.message ? body.message : undefined;
    return new ApiError(kindFromStatus(status), message, status, body?.errors);
  }

  return new ApiError("unknown");
}
