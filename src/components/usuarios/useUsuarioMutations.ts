"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUsuario, updateAtivo, updatePerfil } from "@/lib/api/services/usuario";
import type { NovoUsuarioResultado, NovoUsuarioValues } from "@/types/usuario";
import { USUARIOS_QUERY_KEY } from "./useUsuarios";

export function useCriarUsuario({ onSuccess }: { onSuccess: (resultado: NovoUsuarioResultado) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: NovoUsuarioValues) => createUsuario(values),
    onSuccess: async (resultado) => {
      await queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
      onSuccess(resultado);
    },
  });
}

export type EdicaoUsuario = { usuarioId: number; perfil?: number; ativo?: boolean };

export type EdicaoFalha = { campo: "perfil" | "acesso"; mensagem: string };

export type EdicaoResultado = { perfilAlterado: boolean; acessoAlterado: boolean; falhas: EdicaoFalha[] };

function mensagemDe(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

// Perfil e acesso são duas chamadas independentes: uma falha não desfaz a outra. O resultado diz o que foi aplicado.
export function useEditarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ usuarioId, perfil, ativo }: EdicaoUsuario): Promise<EdicaoResultado> => {
      const resultado: EdicaoResultado = { perfilAlterado: false, acessoAlterado: false, falhas: [] };
      if (perfil !== undefined) {
        try {
          await updatePerfil(usuarioId, perfil);
          resultado.perfilAlterado = true;
        } catch (error) {
          resultado.falhas.push({ campo: "perfil", mensagem: mensagemDe(error) });
        }
      }
      if (ativo !== undefined) {
        try {
          await updateAtivo(usuarioId, ativo);
          resultado.acessoAlterado = true;
        } catch (error) {
          resultado.falhas.push({ campo: "acesso", mensagem: mensagemDe(error) });
        }
      }
      return resultado;
    },
    // Mesmo com falha parcial a lista é recarregada, para refletir o que de fato foi aplicado.
    onSettled: () => queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY }),
  });
}
