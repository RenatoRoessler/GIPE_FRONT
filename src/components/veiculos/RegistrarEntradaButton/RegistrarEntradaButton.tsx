"use client";

import { useState } from "react";
import { DiscButton } from "@/components/ui/DiscButton";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { EntradaVeiculoModal } from "../EntradaVeiculoModal";

export function RegistrarEntradaButton() {
  const [open, setOpen] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  return (
    <>
      <DiscButton badge="E" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Registrar entrada
      </DiscButton>
      {open && <EntradaVeiculoModal onClose={() => setOpen(false)} onSuccess={showToast} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </>
  );
}
