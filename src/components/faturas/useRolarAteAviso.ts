"use client";

import { useEffect, useRef } from "react";

// Leva à vista o aviso (por exemplo, um erro no topo de um modal rolável) assim que ele aparece.
// A ref vai no elemento que embrulha o aviso; sem animação, então não há o que adaptar a prefers-reduced-motion.
export function useRolarAteAviso(ativo: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ativo) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [ativo]);

  return ref;
}
