import type { SituacaoFiltro } from "@/types/conveniada";

export const CONVENIADAS_QUERY_KEY = ["conveniadas"] as const;

export const conveniadasKey = (situacao: SituacaoFiltro) => [...CONVENIADAS_QUERY_KEY, situacao] as const;
