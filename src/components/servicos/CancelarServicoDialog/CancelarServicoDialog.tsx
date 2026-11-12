"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { ItemFila } from "@/types/servico";
import { MOTIVO_MAXIMO, useCancelarServico } from "../useServicosDoVeiculo";
import { Corpo, Resumo } from "./CancelarServicoDialog.styles";

export interface CancelarServicoDialogProps {
  item: Pick<ItemFila, "idPatio" | "patioServicoId" | "nomeServico" | "placa">;
  onClose: () => void;
  onCancelado: () => void;
}

// Cancela um serviço que ainda não começou. O motivo é obrigatório: o botão só liga com ele preenchido. No celular
// vira folha inferior; no desktop, janela.
export function CancelarServicoDialog({ item, onClose, onCancelado }: CancelarServicoDialogProps) {
  const celular = useIsMobile();
  const cancelar = useCancelarServico(item.idPatio);
  const [motivo, setMotivo] = useState("");
  const enviando = cancelar.isPending;
  const valido = motivo.trim() !== "" && motivo.trim().length <= MOTIVO_MAXIMO;

  function confirmar() {
    cancelar.mutate({ patioServicoId: item.patioServicoId, motivo }, { onSuccess: onCancelado });
  }

  const corpo = (
    <Corpo>
      <Resumo>
        {item.nomeServico} · placa {item.placa}
      </Resumo>
      {cancelar.isError && <ErrorBanner role="alert">{cancelar.error.message}</ErrorBanner>}
      <Textarea
        label="Motivo"
        value={motivo}
        limite={MOTIVO_MAXIMO}
        data-autofocus
        disabled={enviando}
        onChange={(event) => setMotivo(event.target.value)}
      />
    </Corpo>
  );
  const rodape = (
    <>
      <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
        Voltar
      </Button>
      <Button type="button" variant="danger" onClick={confirmar} disabled={!valido || enviando}>
        {enviando ? "Cancelando..." : "Cancelar serviço"}
      </Button>
    </>
  );

  return celular ? (
    <BottomSheet open title="Cancelar serviço" onClose={onClose} footer={rodape}>
      {corpo}
    </BottomSheet>
  ) : (
    <Modal open title="Cancelar serviço" onClose={onClose} footer={rodape} closeOnBackdrop={false}>
      {corpo}
    </Modal>
  );
}
