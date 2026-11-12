"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { atualizarServico, criarServico, inativarServico, listServicos } from "@/lib/api/services/servico";
import type { ServicoPayload } from "@/types/servico";
import { SERVICOS_LISTA_KEY, servicosListaKey } from "./servicosKeys";

// Catálogo da empresa. `ativo` vai ao back (true, false ou todos); a busca por nome é local, na tela.
export function useServicos(ativo?: boolean) {
  return useQuery({
    queryKey: servicosListaKey(ativo),
    queryFn: () => listServicos(ativo),
    staleTime: 60_000,
  });
}

// O aviso de sucesso ("Serviço criado.") fica com a tela, como nos outros módulos. Erro 400 (nome repetido, sem preço)
// chega como ApiError, com a mensagem do back.
export function useServicoMutations() {
  const queryClient = useQueryClient();
  const atualizarLista = () => queryClient.invalidateQueries({ queryKey: SERVICOS_LISTA_KEY });

  const criar = useMutation({
    mutationFn: (payload: ServicoPayload) => criarServico(payload),
    onSuccess: atualizarLista,
  });
  const atualizar = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ServicoPayload }) => atualizarServico(id, payload),
    onSuccess: atualizarLista,
  });
  const inativar = useMutation({
    mutationFn: (id: number) => inativarServico(id),
    onSuccess: atualizarLista,
  });

  return { criar, atualizar, inativar };
}
