"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Paginado } from "@/lib/api/types";
import type { Mensalista } from "@/types/mensalista";
import { buscaEhTexto, filtrarMensalistas } from "./agenda";
import { useAgendaMensalistas } from "./useAgendaMensalistas";
import { MENSALISTAS_PAGE_SIZE, useMensalistas } from "./useMensalistas";

const DEBOUNCE_MS = 250;

// A lista busca por documento no servidor (paginada) e por nome ou placa sobre o conjunto completo, o mesmo da agenda:
// a API só filtra por documento. Escolhe o modo pelo que foi digitado.
export function useMensalistasDaLista(pagina: number, busca: string) {
  const modoTexto = buscaEhTexto(busca);
  const porDocumento = useMensalistas(pagina, busca, { enabled: !modoTexto });
  const completo = useAgendaMensalistas({ enabled: modoTexto });
  const termo = useDebouncedValue(modoTexto ? busca.trim() : "", DEBOUNCE_MS);

  if (!modoTexto) {
    return { ...porDocumento, buscando: porDocumento.documento !== "", modoTexto };
  }

  const filtrados = completo.data ? filtrarMensalistas(completo.data.items, termo) : null;
  const totalPages = filtrados ? Math.ceil(filtrados.length / MENSALISTAS_PAGE_SIZE) : 0;
  const page = Math.min(Math.max(pagina, 1), Math.max(totalPages, 1));
  const data: Paginado<Mensalista> | undefined = filtrados
    ? {
        items: filtrados.slice((page - 1) * MENSALISTAS_PAGE_SIZE, page * MENSALISTAS_PAGE_SIZE),
        page,
        pageSize: MENSALISTAS_PAGE_SIZE,
        totalRecords: filtrados.length,
        totalPages,
      }
    : undefined;

  return {
    data,
    isPending: completo.isPending,
    isError: completo.isError,
    error: completo.error,
    refetch: completo.refetch,
    isFetching: completo.isFetching,
    // Digitando, o resultado muda antes do debounce: a lista fica esmaecida até ele acompanhar.
    isPlaceholderData: completo.isPlaceholderData || termo !== busca.trim(),
    documento: termo,
    buscando: termo !== "",
    modoTexto,
  };
}
