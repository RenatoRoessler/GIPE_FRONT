"use client";

import { useEffect, useRef } from "react";
import { getSituacao } from "@/lib/api/services/preco.mapper";
import type { PrecoView } from "@/types/preco";
import type { UsePrecos } from "./usePrecos";
import type { PrecosUrlState } from "./usePrecosUrlState";

export interface SelecaoPrecos {
  selecionada: PrecoView | null;
  // O endereço aponta para uma tabela que não está (ou deixou de estar) na lista.
  inexistente: boolean;
}

export function maiorId(precos: PrecoView[]): number | null {
  return precos.length === 0 ? null : Math.max(...precos.map((preco) => preco.rotatividadeId));
}

// Seleção padrão: a primeira vigente da página, senão o primeiro item da página, senão nenhuma.
// Ela NÃO é gravada no endereço: só uma escolha explícita (toque na esteira ou na lista) entra nele.
export function selecaoPadrao(itens: PrecoView[], agora: Date): PrecoView | null {
  const vigente = itens.find((preco) => getSituacao(preco.ativo, preco.inicioVigencia, preco.fimVigencia, agora) === "vigente");
  return vigente ?? itens[0] ?? null;
}

export function useSelecaoPrecos(estado: PrecosUrlState, precos: UsePrecos): SelecaoPrecos {
  const { preco, salvo, selecionar } = estado;
  const pronto = precos.status === "pronto" ? precos : null;
  const concluida = useRef(false);

  // Depois de criar uma tabela o back não devolve o id: assume-se que o maior id é o da recém-criada.
  // Espera a lista terminar de recarregar para não escolher entre dados antigos.
  const todas = pronto?.todas ?? null;
  const atualizando = pronto?.atualizando ?? true;
  useEffect(() => {
    if (salvo !== "criado" || preco !== null || todas === null || atualizando || concluida.current) {
      return;
    }
    const novo = maiorId(todas);
    if (novo !== null) {
      concluida.current = true;
      selecionar(novo);
    }
  }, [salvo, preco, todas, atualizando, selecionar]);

  if (!pronto) {
    return { selecionada: null, inexistente: false };
  }

  if (preco !== null) {
    const escolhida = pronto.todas.find((item) => item.rotatividadeId === preco) ?? null;
    return { selecionada: escolhida, inexistente: escolhida === null };
  }

  return { selecionada: selecaoPadrao(pronto.pagina.itens, new Date()), inexistente: false };
}
