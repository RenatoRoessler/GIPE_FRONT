"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { Body, CloseButton, Dialog, Footer, Header, ModalSize, Title } from "./Modal.styles";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  // Clique no fundo fecha por padrão; desligue em fluxos com dados em andamento.
  closeOnBackdrop?: boolean;
}

// Usa o <dialog> nativo: foco preso, Esc e backdrop vêm do navegador.
export function Modal({ open, title, onClose, children, footer, size = "sm", closeOnBackdrop = true }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) {
      return;
    }
    // O foco volta ao elemento que abriu o modal, mesmo que o <dialog> seja desmontado.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, [open]);

  return (
    <Dialog
      ref={dialogRef}
      $size={size}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Header>
        <Title id={titleId}>{title}</Title>
        <CloseButton type="button" aria-label="Fechar" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </CloseButton>
      </Header>
      <Body>{children}</Body>
      {footer && <Footer>{footer}</Footer>}
    </Dialog>
  );
}
