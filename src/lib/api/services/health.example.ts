import { api } from "../client";
import type { ApiResponse } from "../types";

// Exemplo de service: função pura que retorna Promise<T> e rejeita com ApiError.
// Em uma feature real, o hook (useQuery/useMutation) fica junto da feature.
export async function getHealth(): Promise<ApiResponse<unknown>> {
  const { data } = await api.get<ApiResponse<unknown>>("/health");
  return data;
}
