"use client";

import { useEffect, useRef, useState } from "react";

type Pendente<Id> = { id: Id; vizinhos: readonly Id[]; anuncio: string };

export interface UseFocoAposRemocaoOptions<Id extends string | number> {
  // Ids que estão na lista agora, na ordem em que aparecem.
  presentes: readonly Id[];
  // Um modal está aberto: o foco só volta para a lista depois que ele fecha.
  bloqueado: boolean;
  // O elemento que recebe o foco para o item `id` (por exemplo, o botão de ação da linha).
  alvoDe: (id: Id) => HTMLElement | null;
  // Para onde o foco vai quando nenhum vizinho sobrou (por exemplo, o campo de busca).
  reserva: () => HTMLElement | null;
}

// Depois que um item sai da lista por uma ação do operador (ex.: registrar a saída de um veículo), o foco não pode
// se perder: vai para o vizinho que ocupa o lugar, ou para a reserva, e o leitor de tela é avisado.
// `marcar` registra o item acionado; quando o bloqueio termina, o hook confere se ele realmente saiu.
// Se ele continua na lista (a ação foi cancelada ou falhou), não mexe no foco.
export function useFocoAposRemocao<Id extends string | number>({
  presentes,
  bloqueado,
  alvoDe,
  reserva,
}: UseFocoAposRemocaoOptions<Id>) {
  const pendente = useRef<Pendente<Id> | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const chave = presentes.join(",");
  const ultimos = useRef({ presentes, alvoDe, reserva });

  useEffect(() => {
    ultimos.current = { presentes, alvoDe, reserva };
  });

  useEffect(() => {
    const acionado = pendente.current;
    if (!acionado || bloqueado) {
      return;
    }
    pendente.current = null;
    const { presentes: agora, alvoDe: procurar, reserva: reservaAgora } = ultimos.current;
    if (agora.includes(acionado.id)) {
      return;
    }
    setAnuncio(acionado.anuncio);
    const proximo = acionado.vizinhos.find((id) => agora.includes(id));
    const alvo = (proximo !== undefined ? procurar(proximo) : null) ?? reservaAgora();
    alvo?.focus();
  }, [chave, bloqueado]);

  function marcar(item: { id: Id; vizinhos: readonly Id[]; anuncio: string }) {
    pendente.current = item;
  }

  return { marcar, anuncio };
}

// Quem vinha depois do item vem primeiro; depois, quem vinha antes (do mais próximo para o mais distante).
export function vizinhosDe<Id>(ordem: readonly Id[], id: Id): Id[] {
  const indice = ordem.indexOf(id);
  return [...ordem.slice(indice + 1), ...ordem.slice(0, Math.max(indice, 0)).reverse()];
}
