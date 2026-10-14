"use client";

import { useState } from "react";
import { DiscButton } from "@/components/ui/DiscButton";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { SaidaVeiculoModal } from "../SaidaVeiculoModal";

export function RegistrarSaidaButton() {
  const [open, setOpen] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  return (
    <>
      <DiscButton badge="S" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Registrar saída
      </DiscButton>
      {open && <SaidaVeiculoModal onClose={() => setOpen(false)} onSuccess={showToast} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </>
  );
}
