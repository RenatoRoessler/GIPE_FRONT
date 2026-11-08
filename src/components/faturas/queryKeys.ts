import type { FaturaFiltros } from "@/types/fatura";

// Tudo de Faturas fica sob este prefixo: invalidá-lo atualiza lista e detalhe de uma vez.
export const FATURAS_KEY = ["faturas"] as const;

export const faturasKey = (filtros: FaturaFiltros) => [...FATURAS_KEY, "lista", filtros] as const;

export const faturaKey = (id: number) => [...FATURAS_KEY, "detalhe", id] as const;
