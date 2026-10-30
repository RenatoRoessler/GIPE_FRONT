"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategoria, updateCategoria } from "@/lib/api/services/financeiro";
import type { CategoriaFormValues } from "@/types/financeiro";
import { FINANCEIRO_KEY } from "./queryKeys";

export type EditarCategoriaValues = { id: number; values: CategoriaFormValues };

export function useCategoriaMutations() {
  const queryClient = useQueryClient();

  // Os nomes das categorias aparecem na lista de lançamentos e no fluxo: tudo do Financeiro recarrega.
  const atualizar = () => queryClient.invalidateQueries({ queryKey: FINANCEIRO_KEY });

  const criar = useMutation({
    mutationFn: (values: CategoriaFormValues) => createCategoria(values),
    retry: false,
    onSuccess: atualizar,
  });

  const editar = useMutation({
    mutationFn: ({ id, values }: EditarCategoriaValues) => updateCategoria(id, values),
    retry: false,
    onSuccess: atualizar,
  });

  return { criar, editar };
}
