import { formatDataInput } from "@/lib/periodo";
import type { PeriodoNotas } from "@/types/notaFiscal";

export { formatDataInput, validarPeriodo } from "@/lib/periodo";

// Período padrão da aba Lançadas: do primeiro dia do mês até hoje.
export function mesAtual(hoje: Date): PeriodoNotas {
  return { de: formatDataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: formatDataInput(hoje) };
}

// "2026-10-01" vira "2026/10/01", como o contrato de `lancadas`.
export function formatDataApi(data: string): string {
  return data.replace(/-/g, "/");
}
