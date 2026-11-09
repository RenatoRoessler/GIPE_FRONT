"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useTheme } from "styled-components";
import { Barra, type DockCorte } from "./DockBar.styles";

export interface DockBarProps {
  children: ReactNode;
  "aria-label": string;
  // Em telas grandes a barra some por padrão; ligue quando o layout grande também precisa dela.
  mostrarNoDesktop?: boolean;
  // A partir de qual largura a barra some: "lg" (padrão, onde o menu vira lateral) ou "md" (tablet).
  ocultarDe?: DockCorte;
}

// Barra fixa do módulo, acima do menu inferior. Publica a altura em `--dock-altura` (no <html>) enquanto está
// montada; o conteúdo usa a variável (ver `folgaDaBarra`) para o fim da página não ficar atrás dela.
export function DockBar({ children, "aria-label": ariaLabel, mostrarNoDesktop = false, ocultarDe = "lg" }: Readonly<DockBarProps>) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = document.documentElement;
    // Sem layout (testes) a medida é 0: vale a altura do token.
    const publicar = () => raiz.style.setProperty("--dock-altura", `${ref.current?.offsetHeight || Number.parseInt(theme.layout.dockHeight, 10)}px`);
    publicar();
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publicar);
    if (ref.current) {
      observador?.observe(ref.current);
    }
    return () => {
      observador?.disconnect();
      raiz.style.removeProperty("--dock-altura");
    };
  }, [theme.layout.dockHeight]);

  return (
    <Barra ref={ref} role="region" aria-label={ariaLabel} $mostrarNoDesktop={mostrarNoDesktop} $corte={ocultarDe}>
      {children}
    </Barra>
  );
}
