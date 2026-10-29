"use client";

import { useQuery } from "@tanstack/react-query";
import { nomeExibido } from "@/components/conveniadas/format";
import { listConveniadas } from "@/lib/api/services/conveniada";
import type { ConveniadaOpcao } from "@/types/conveniada";

// Conveniadas com convênio ativo para o campo "Empresa conveniada"; muda pouco, então não refaz a busca ao focar a janela.
export function usePrecoConvenios() {
  return useQuery({
    queryKey: ["conveniadas", "opcoes-preco"],
    queryFn: async (): Promise<ConveniadaOpcao[]> => {
      const conveniadas = await listConveniadas("ativos");
      return conveniadas.map((conveniada) => ({
        empresaConveniadaId: conveniada.empresaConveniadaId,
        nome: nomeExibido(conveniada),
      }));
    },
    refetchOnWindowFocus: false,
  });
}
