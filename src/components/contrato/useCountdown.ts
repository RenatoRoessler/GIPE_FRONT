"use client";

import { useEffect, useState } from "react";

// Contagem regressiva em segundos (ex.: esperar o limite de tentativas liberar).
export function useCountdown() {
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    if (restante <= 0) {
      return;
    }
    const timer = setTimeout(() => setRestante((atual) => atual - 1), 1000);
    return () => clearTimeout(timer);
  }, [restante]);

  return { restante, iniciar: (segundos: number) => setRestante(segundos) };
}

// 42 -> "0:42"
export function formatCountdown(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, "0")}`;
}
