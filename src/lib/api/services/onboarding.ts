import type { Onboarding } from "@/types/onboarding";
import { api } from "../client";

// A pessoa é identificada pelo token. Só `visualizado` decide: qualquer outra coisa conta como "ainda não visto".
export async function getOnboarding(): Promise<Onboarding> {
  const { data } = await api.get<Record<string, unknown> | null>("/Onboarding");
  return {
    visualizado: data?.visualizado === true,
    dataVisualizacao: typeof data?.dataVisualizacao === "string" ? data.dataVisualizacao : null,
  };
}

// Não há como desfazer: o back só aceita marcar como visualizado.
export async function marcarOnboardingVisualizado(): Promise<void> {
  await api.put("/Onboarding", { visualizado: true });
}
