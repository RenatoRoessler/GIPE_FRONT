"use client";

import { useEffect, useState } from "react";

export type Retangulo = { top: number; left: number; width: number; height: number };

function medir(alvo: HTMLElement): Retangulo | null {
  const { top, left, width, height } = alvo.getBoundingClientRect();
  return width > 0 && height > 0 ? { top, left, width, height } : null;
}

// Há um item por menu (lateral e barra inferior) e só um está visível; o escondido mede zero.
function encontrar(id: string): HTMLElement | null {
  const candidatos = document.querySelectorAll<HTMLElement>("[data-tour-id]");
  return Array.from(candidatos).find((candidato) => candidato.dataset.tourId === id && medir(candidato) !== null) ?? null;
}

function iguais(a: Retangulo | null, b: Retangulo | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

// Acompanha o item do menu de um passo: devolve o elemento e o retângulo atual (null se o passo não tem alvo visível, como os
// módulos que ficam no "Mais" do celular). O menu lateral expande ao passar o mouse e a janela pode rolar ou girar,
// então o retângulo é reconferido a cada quadro e só vira estado quando muda.
export function useAlvoTour(id: string | undefined) {
  const [alvo, setAlvo] = useState<{ elemento: HTMLElement; retangulo: Retangulo } | null>(null);

  useEffect(() => {
    if (!id) return;
    let quadro = 0;
    let rolou = false;

    function acompanhar() {
      const elemento = encontrar(id!);
      const retangulo = elemento ? medir(elemento) : null;
      if (elemento && !rolou) {
        // Menu lateral longo rola por dentro: traz o item para a vista antes de destacá-lo.
        elemento.scrollIntoView({ block: "nearest", inline: "nearest" });
        rolou = true;
      }
      setAlvo((atual) => {
        if (!elemento || !retangulo) return atual === null ? atual : null;
        if (atual && atual.elemento === elemento && iguais(atual.retangulo, retangulo)) return atual;
        return { elemento, retangulo };
      });
      quadro = window.requestAnimationFrame(acompanhar);
    }

    quadro = window.requestAnimationFrame(acompanhar);
    return () => {
      window.cancelAnimationFrame(quadro);
      setAlvo(null);
    };
  }, [id]);

  return id ? alvo : null;
}
