"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { escolherQuadroChave } from "@/lib/api/services/quadroChaves";
import type { ChaveEscolhida, QuadroChaves } from "@/types/quadroChaves";
import type { ChaveRef } from "@/types/patio";
import { escolherQuadroInicial, localizarPosicao, sugerirGancho } from "../gancho";
import { QUADROS_QUERY_KEY } from "../quadrosKeys";

// A chave que o veículo já tem no quadro: o texto para a tela e, quando o back permite, a posição em partes.
export type ChaveAtual = { rotulo: string; ref: ChaveRef | null };

export interface UseEscolherGanchoOptions {
  patioId: number;
  quadros: QuadroChaves[];
  onGuardado: (chave: ChaveEscolhida) => void;
  // A posição de onde a chave sai, ao trocar de gancho; sem ela, é a primeira vez que o veículo guarda a chave.
  atual?: ChaveAtual | null;
}

// Estado da escolha do gancho. O quadro e o gancho escolhidos pelo operador são só ids; o que vale na tela é derivado da lista
// mais recente: se o gancho escolhido ficou ocupado (outro terminal), a seleção volta à sugestão sem estado a acertar.
export function useEscolherGancho({ patioId, quadros, onGuardado, atual = null }: UseEscolherGanchoOptions) {
  const queryClient = useQueryClient();
  const [quadroId, setQuadroId] = useState<number | null>(null);
  const [ganchoId, setGanchoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Ao trocar, a grade abre no quadro onde a chave está hoje.
  const posicaoAtual = localizarPosicao(quadros, atual?.ref);
  const quadro =
    quadros.find((item) => item.patioQuadroId === quadroId) ??
    quadros.find((item) => item.patioQuadroId === posicaoAtual?.patioQuadroId) ??
    escolherQuadroInicial(quadros);
  // Trocar é uma decisão do operador: sem sugestão, para um toque acidental na confirmação não mover a chave.
  const sugerido = atual ? null : sugerirGancho(quadro);

  const escolhido = quadro?.linhas
    .flatMap((linha) => linha.colunas.map((posicao) => ({ linha: linha.linha, ...posicao })))
    .find((posicao) => posicao.patioQuadroChaveId === ganchoId && posicao.disponivel);
  const selecionado = escolhido
    ? { patioQuadroChaveId: escolhido.patioQuadroChaveId, linha: escolhido.linha, coluna: escolhido.coluna }
    : sugerido;

  const mutation = useMutation({
    mutationFn: (patioQuadroChaveId: number) => escolherQuadroChave(patioId, patioQuadroChaveId),
    onSuccess: async (chave) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY }),
      ]);
      onGuardado(chave);
    },
    onError: (err) => {
      setErro(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
      setGanchoId(null);
      // Conflito: a grade precisa mostrar quem pegou o gancho.
      void queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY });
    },
  });

  return {
    quadro,
    selecionado,
    atualId: posicaoAtual?.patioQuadroChaveId ?? null,
    // A sugestão vale enquanto o operador não escolheu outro gancho.
    ehSugestao: escolhido === undefined,
    erro,
    guardando: mutation.isPending,
    escolherQuadro: (id: number) => {
      setQuadroId(id);
      setGanchoId(null);
      setErro(null);
    },
    escolherGancho: (id: number) => {
      setGanchoId(id);
      setErro(null);
    },
    guardar: () => {
      if (selecionado) {
        setErro(null);
        mutation.mutate(selecionado.patioQuadroChaveId);
      }
    },
  };
}
