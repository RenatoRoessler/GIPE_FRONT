import type { Dashboard, DashboardParams } from "@/types/dashboard";
import { api } from "../client";
import { fromDashboardResponse } from "./dashboard.mapper";

// Uma chamada traz tudo da Visão Geral. `data` é qualquer dia dentro do período (AAAA-MM-DD; o back lê "19/11/2026" como mês/dia)
// e, omitida, vale hoje. Data futura devolve 400 e sem permissão devolve 403: os dois sobem como `ApiError`.
export async function getDashboard({ periodo, data }: DashboardParams): Promise<Dashboard> {
  const { data: resposta } = await api.get<unknown>("/Dashboard", {
    params: { periodo, ...(data ? { data } : {}) },
  });
  return fromDashboardResponse(resposta);
}
