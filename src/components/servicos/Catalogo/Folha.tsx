"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Alca, Painel, Veu } from "./Folha.styles";

export interface FolhaProps {
  // O id do título (para `aria-labelledby`).
  tituloId: string;
  children: ReactNode;
  onFechar: () => void;
  // No computador a folha fica no centro; no celular sobe da borda de baixo, com a alça.
  centro?: boolean;
}

const FOCAVEIS = 'button:not(:disabled), input:not(:disabled), [href], textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// A folha do protótipo: um painel sobre o véu escuro. Esc e o toque no véu fecham; o foco fica dentro dela enquanto aberta e
// volta ao botão que a abriu quando fecha.
export function Folha({ tituloId, children, onFechar, centro = false }: FolhaProps) {
  const painel = useRef<HTMLDivElement>(null);
  const aoFechar = useRef(onFechar);

  useEffect(() => {
    aoFechar.current = onFechar;
  }, [onFechar]);

  useEffect(() => {
    const abriu = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const primeiro = painel.current?.querySelector<HTMLElement>("[data-foco-inicial]") ?? painel.current?.querySelector<HTMLElement>(FOCAVEIS);
    (primeiro ?? painel.current)?.focus();

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        aoFechar.current();
        return;
      }
      if (event.key !== "Tab" || !painel.current) return;
      const itens = Array.from(painel.current.querySelectorAll<HTMLElement>(FOCAVEIS));
      if (itens.length === 0) return;
      const primeiroItem = itens[0];
      const ultimo = itens[itens.length - 1];
      if (event.shiftKey && document.activeElement === primeiroItem) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiroItem.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      document.removeEventListener("keydown", aoTeclar, true);
      abriu?.focus();
    };
  }, []);

  return (
    <Veu $centro={centro} onClick={(event) => event.target === event.currentTarget && onFechar()}>
      <Painel ref={painel} $centro={centro} role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1}>
        {!centro && <Alca aria-hidden="true" />}
        {children}
      </Painel>
    </Veu>
  );
}
