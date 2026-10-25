"use client";

import { useEffect, useState } from "react";

// Largura mínima de cada espaço da barra inferior: o alvo de toque de 44px e o maior rótulo curto ("Mensalistas",
// cerca de 66px em 12px) sem reticências.
export const SLOT_MIN = 68;

// Quantos espaços de `SLOT_MIN` cabem na largura do elemento ligado a `ref`.
// `capacidade` é `null` até a primeira medição (no servidor e na hidratação), para a barra não depender de `window`.
// Mede o elemento externo da barra, cuja largura vem da janela e não do conteúdo, para o ajuste não entrar em laço.
// `larguraMaxima` limita a largura útil (o conteúdo da barra tem largura máxima em telas grandes).
export function useBarCapacity(larguraMaxima = Infinity) {
  const [elemento, setElemento] = useState<HTMLElement | null>(null);
  const [capacidade, setCapacidade] = useState<number | null>(null);

  useEffect(() => {
    if (!elemento) {
      return;
    }

    function atualizar(largura: number) {
      setCapacidade(Math.floor(Math.min(largura, larguraMaxima) / SLOT_MIN));
    }

    if (typeof ResizeObserver === "undefined") {
      // Sem ResizeObserver, acompanha a janela, que é o que define a largura da barra.
      const medir = () => atualizar(elemento.getBoundingClientRect().width);
      queueMicrotask(medir);
      window.addEventListener("resize", medir);
      return () => window.removeEventListener("resize", medir);
    }

    const observador = new ResizeObserver((entradas) => {
      const entrada = entradas[entradas.length - 1];
      if (entrada) {
        atualizar(entrada.contentRect.width);
      }
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [elemento, larguraMaxima]);

  return { ref: setElemento, capacidade };
}
