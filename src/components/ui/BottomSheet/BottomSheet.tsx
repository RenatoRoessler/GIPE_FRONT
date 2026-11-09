"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { Alca, Cabecalho, Corpo, Fechar, Folha, Rodape, Titulo } from "./BottomSheet.styles";

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

// Folha inferior sobre o <dialog> nativo (foco preso, Esc e fundo vêm do navegador), como o Modal:
// no celular sobe do rodapé acima do menu; em telas maiores vira um painel lateral.
export function BottomSheet({ open, title, onClose, children, footer }: Readonly<BottomSheetProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) {
      return;
    }
    // O foco volta ao elemento que abriu a folha, mesmo que o <dialog> seja desmontado.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, [open]);

  return (
    <Folha
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Cabecalho>
        <Alca aria-hidden="true" />
        <Titulo id={titleId}>{title}</Titulo>
        <Fechar type="button" aria-label="Fechar" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Fechar>
      </Cabecalho>
      <Corpo>{children}</Corpo>
      {footer && <Rodape>{footer}</Rodape>}
    </Folha>
  );
}
