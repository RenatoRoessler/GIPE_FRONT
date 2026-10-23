"use client";

import { useQuery } from "@tanstack/react-query";
import { isForbiddenError } from "@/lib/api/errors";
import { listAllPrecos } from "@/lib/api/services/preco";
import type { PrecoView } from "@/types/preco";
import { contarPrecos, filtrarPrecos, type FiltroSituacao } from "../filtros";

export const PRECOS_QUERY_KEY = ["precos", "todas"] as const;
export const PRECOS_PAGE_SIZE = 20;

export interface UsePrecosEstado {
  q: string;
  situacao: FiltroSituacao;
  pagina: number;
}

export type UsePrecos =
  | { status: "carregando" }
  | { status: "erro"; erro: string; semPermissao: boolean; refetch: () => void }
  | {
      status: "pronto";
      todas: PrecoView[];
      filtradas: PrecoView[];
      // Página pedida, ajustada à última válida quando está fora do intervalo.
      pagina: { itens: PrecoView[]; page: number; totalPages: number; totalRecords: number; pageSize: number };
      contagem: string;
      // A página pedida na URL não existe mais (ex.: registros removidos): quem lê deve corrigir a URL.
      paginaForaDoIntervalo: boolean;
      // Revalidando em segundo plano (ex.: depois de salvar no wizard).
      atualizando: boolean;
    };

// A API só aceita `pagina` e `tamanhoPagina`, então a carga é completa e a busca, o filtro e a paginação
// acontecem aqui, em memória. Se a API passar a filtrar no servidor, a troca é só neste hook.
export function usePrecos({ q, situacao, pagina }: UsePrecosEstado): UsePrecos {
  const query = useQuery({
    queryKey: PRECOS_QUERY_KEY,
    queryFn: listAllPrecos,
    refetchOnWindowFocus: false,
  });

  if (query.data === undefined) {
    return query.isError
      ? { status: "erro", erro: query.error.message, semPermissao: isForbiddenError(query.error), refetch: () => void query.refetch() }
      : { status: "carregando" };
  }

  const todas = query.data;
  const filtradas = filtrarPrecos(todas, { q, situacao }, new Date());
  const totalPages = Math.max(1, Math.ceil(filtradas.length / PRECOS_PAGE_SIZE));
  const page = Math.min(Math.max(1, pagina), totalPages);
  const inicio = (page - 1) * PRECOS_PAGE_SIZE;

  return {
    status: "pronto",
    todas,
    filtradas,
    pagina: {
      itens: filtradas.slice(inicio, inicio + PRECOS_PAGE_SIZE),
      page,
      totalPages,
      totalRecords: filtradas.length,
      pageSize: PRECOS_PAGE_SIZE,
    },
    contagem: contarPrecos(filtradas.length, situacao),
    paginaForaDoIntervalo: pagina > totalPages,
    atualizando: query.isFetching,
  };
}
