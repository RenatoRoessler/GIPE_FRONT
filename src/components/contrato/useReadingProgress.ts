"use client";

import { useEffect, useState, type RefObject } from "react";

// Quanto da folha já passou pela base da tela (0 a 1). Só acompanha a rolagem: não bloqueia nada.
// `ativo` entra nas dependências porque a folha só existe depois que o contrato carrega.
export function useReadingProgress(ref: RefObject<HTMLElement | null>, ativo: boolean): number {
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const folha = ref.current;
    if (!ativo || !folha) {
      return;
    }

    let frame = 0;
    function atualizar() {
      frame = 0;
      const { top, height } = folha!.getBoundingClientRect();
      const lido = height > 0 ? (window.innerHeight - top) / height : 0;
      setProgresso(Math.min(1, Math.max(0, lido)));
    }
    function agendar() {
      if (frame === 0) {
        frame = requestAnimationFrame(atualizar);
      }
    }

    agendar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar, { passive: true });
    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      cancelAnimationFrame(frame);
    };
  }, [ref, ativo]);

  return progresso;
}
