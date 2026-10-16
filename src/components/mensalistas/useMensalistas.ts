"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { normalizeDocumento } from "@/lib/documento";
import { listMensalistas } from "@/lib/api/services/mensalista";
import { MENSALISTAS_QUERY_KEY } from "./useTiposMensalidade";

export const MENSALISTAS_PAGE_SIZE = 20;
const DEBOUNCE_MS = 250;

// `busca` é o que o usuário digitou (com máscara); a consulta usa o documento normalizado, com debounce.
export function useMensalistas(pagina: number, busca: string) {
  const documento = useDebouncedValue(normalizeDocumento(busca), DEBOUNCE_MS);

  const query = useQuery({
    queryKey: [...MENSALISTAS_QUERY_KEY, { pagina, documento }],
    queryFn: () => listMensalistas({ pagina, tamanhoPagina: MENSALISTAS_PAGE_SIZE, documento }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  return { ...query, documento };
}
