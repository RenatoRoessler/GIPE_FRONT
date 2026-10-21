"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";
import { reenviarContrato } from "@/lib/api/services/mensalista";
import { contratoQueryKey } from "./useContratosMensalistas";

export interface UseReenviarContratoOptions {
  onSuccess?: (result: { email: string; tokenExpiracao: string | null }) => void;
  onError?: (message: string) => void;
}

export function useReenviarContrato({ onSuccess, onError }: UseReenviarContratoOptions = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (mensalistaId: number) => reenviarContrato(mensalistaId),
    onSuccess: async (result, mensalistaId) => {
      await queryClient.invalidateQueries({ queryKey: contratoQueryKey(mensalistaId) });
      onSuccess?.(result);
    },
    onError: async (error, mensalistaId) => {
      // 400 = o contrato já foi aceito (em outra aba, ou o mensalista acabou de aceitar): a linha se corrige.
      if (error instanceof ApiError && error.status === 400) {
        await queryClient.invalidateQueries({ queryKey: contratoQueryKey(mensalistaId) });
      }
      onError?.(error.message);
    },
  });

  return {
    reenviar: (mensalistaId: number) => mutation.mutate(mensalistaId),
    // Só a linha em andamento fica desabilitada.
    reenviandoId: mutation.isPending ? mutation.variables : null,
  };
}
