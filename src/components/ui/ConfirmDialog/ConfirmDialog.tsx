"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmação de ação destrutiva (ex.: descartar dados em andamento). Só fecha pelos botões ou pelo "×"/Esc, que cancelam.
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open
      title={title}
      onClose={onCancel}
      closeOnBackdrop={false}
      fullScreenOnMobile={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Text variant="muted">{message}</Text>
    </Modal>
  );
}
