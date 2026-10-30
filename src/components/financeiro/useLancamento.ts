"use client";

import { useQuery } from "@tanstack/react-query";
import { getLancamento } from "@/lib/api/services/financeiro";
import { lancamentoKey } from "./queryKeys";

// Detalhe e edição leem o lançamento do back, não da lista: outra pessoa pode tê-lo cancelado desde que a lista carregou.
export function useLancamento(id: number | null) {
  return useQuery({
    enabled: id !== null,
    queryKey: lancamentoKey(id ?? 0),
    queryFn: () => getLancamento(id as number),
    refetchOnWindowFocus: false,
  });
}
