"use client";

import { useMemo } from "react";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { destacarTrecho, filtrarModelos } from "@/lib/buscaModelo";
import { useModelos } from "./useModelos";

// Sugestões de modelo para o texto digitado, a partir da lista já carregada (sem consultar o backend a cada tecla).
export function useSugestoesModelo(texto: string) {
  const { data, isPending } = useModelos();
  const sugestoes = useMemo(() => filtrarModelos(data ?? [], texto), [data, texto]);
  const opcoes = useMemo<ComboboxOption[]>(
    () =>
      sugestoes.map((modelo) => ({
        id: modelo.modeloId,
        label: modelo.nome,
        destaque: destacarTrecho(modelo.nome, texto),
      })),
    [sugestoes, texto],
  );

  return { modelos: data ?? [], sugestoes, opcoes, carregando: isPending };
}
