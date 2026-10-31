"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Content, Sheet } from "./KeyboardSheet.styles";

export const TECLADO_ALTURA_VAR = "--teclado-altura";
export const TECLADO_ATTR = "data-teclado";

export interface KeyboardSheetProps {
  // Nome falado da folha ("Teclado de placa", "Teclado numérico", ...).
  ariaLabel: string;
  // O campo aponta para a folha com `aria-controls`.
  id?: string;
  children: ReactNode;
}

function limparAltura() {
  const raiz = document.documentElement;
  raiz.style.removeProperty(TECLADO_ALTURA_VAR);
  raiz.removeAttribute(TECLADO_ATTR);
}

// Folha fixa na base da tela. Publica a própria altura em `--teclado-altura` para a tela abrir espaço.
export function KeyboardSheet({ ariaLabel, id, children }: KeyboardSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const folha = ref.current;
    if (!folha) {
      return;
    }
    const raiz = document.documentElement;
    function publicar() {
      raiz.style.setProperty(TECLADO_ALTURA_VAR, `${folha?.offsetHeight ?? 0}px`);
      raiz.setAttribute(TECLADO_ATTR, "aberto");
    }
    publicar();
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publicar);
    observador?.observe(folha);
    return () => {
      observador?.disconnect();
      limparAltura();
    };
  }, []);

  return (
    <Sheet
      ref={ref}
      id={id}
      role="group"
      aria-label={ariaLabel}
      // Tocar na folha não pode tirar o foco do campo.
      onPointerDown={(event) => event.preventDefault()}
    >
      <Content>{children}</Content>
    </Sheet>
  );
}
