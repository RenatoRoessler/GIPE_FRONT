import type { FluxoParams, LancamentoFiltros } from "@/types/financeiro";

// Tudo do Financeiro fica sob este prefixo: invalidá-lo atualiza fluxo, lançamentos e categorias de uma vez.
export const FINANCEIRO_KEY = ["financeiro"] as const;

export const CATEGORIAS_KEY = [...FINANCEIRO_KEY, "categorias"] as const;

export const fluxoKey = (params: FluxoParams) => [...FINANCEIRO_KEY, "fluxo", params] as const;

export const lancamentosKey = (filtros: LancamentoFiltros) => [...FINANCEIRO_KEY, "lancamentos", filtros] as const;

export const lancamentoKey = (id: number) => [...FINANCEIRO_KEY, "lancamento", id] as const;
