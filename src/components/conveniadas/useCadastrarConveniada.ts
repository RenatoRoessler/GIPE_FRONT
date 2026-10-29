"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cadastrarConveniada } from "@/lib/api/services/conveniada";
import type { ConveniadaFormValues, ConveniadaResultado } from "@/types/conveniada";
import { CONVENIADAS_QUERY_KEY } from "./conveniadasKeys";

export function useCadastrarConveniada({ onSuccess }: { onSuccess: (resultado: ConveniadaResultado) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ConveniadaFormValues) => cadastrarConveniada(values),
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: CONVENIADAS_QUERY_KEY });
      onSuccess(resultado);
    },
  });
}
