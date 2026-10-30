"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";

export interface ErrorDialogProps {
  title: string;
  message: string;
  onClose: () => void;
  // Rótulo do botão que só fecha (o "×" do Modal já se chama "Fechar").
  closeLabel?: string;
  // Ação de recuperação (ex.: "Tentar novamente"); sem ela, só o botão de fechar.
  actionLabel?: string;
  onAction?: () => void;
}

// Aviso de falha que precisa ser visto (ex.: não foi possível salvar). Fecha pelo botão, pelo "×" ou pelo Esc.
export function ErrorDialog({ title, message, onClose, closeLabel = "Entendi", actionLabel, onAction }: ErrorDialogProps) {
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      closeOnBackdrop={false}
      fullScreenOnMobile={false}
      footer={
        <>
          <Button type="button" variant={onAction ? "secondary" : "primary"} onClick={onClose} autoFocus={!onAction}>
            {closeLabel}
          </Button>
          {onAction && actionLabel && (
            <Button type="button" onClick={onAction} autoFocus>
              {actionLabel}
            </Button>
          )}
        </>
      }
    >
      <Text>{message}</Text>
    </Modal>
  );
}
