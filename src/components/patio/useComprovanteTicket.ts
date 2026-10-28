"use client";

import { useQuery } from "@tanstack/react-query";
import { consultarComprovante } from "@/lib/api/services/patio";
import { patioComprovanteKey } from "./patioKeys";

export const TICKET_ATUALIZACAO_MS = 30_000;

// Valor até agora, permanência e dados do estabelecimento, calculados pelo servidor. Sem token (comprovante
// indisponível) a consulta nem começa. Não atualiza com a aba escondida.
export function useComprovanteTicket(token: string | null) {
  return useQuery({
    queryKey: patioComprovanteKey(token ?? ""),
    queryFn: () => consultarComprovante(token as string),
    enabled: token !== null,
    staleTime: 15_000,
    refetchInterval: TICKET_ATUALIZACAO_MS,
    refetchIntervalInBackground: false,
  });
}
