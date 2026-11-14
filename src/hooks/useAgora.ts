"use client";

import { useEffect, useState } from "react";

// O instante atual (ms), renovado a cada `intervaloMs`. Quem só mostra minutos usa um intervalo longo, e só o trecho
// que muda a cada segundo (como "Atualizado há 12 s") paga o re-render por segundo.
export function useAgora(intervaloMs: number): number {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs]);

  return agora;
}
