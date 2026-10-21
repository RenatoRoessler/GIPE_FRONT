"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "styled-components";

function temMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

// Acompanha uma media query. Sem matchMedia (servidor, testes) vale `false`, o layout de tela larga.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      if (!temMatchMedia()) {
        return () => {};
      }
      const lista = window.matchMedia(query);
      lista.addEventListener("change", avisar);
      return () => lista.removeEventListener("change", avisar);
    },
    () => (temMatchMedia() ? window.matchMedia(query).matches : false),
    () => false,
  );
}

// Abaixo de `breakpoints.md`: o mesmo ponto em que as telas de mensalistas trocam para o layout de celular.
export function useIsMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(`(max-width: ${parseInt(theme.breakpoints.md, 10) - 1}px)`);
}
