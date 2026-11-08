"use client";

import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";
import { ApiError } from "@/lib/api/errors";
import type { Fatura } from "@/types/fatura";
import { BotaoPerigoEmbaixo, BotaoRodape } from "../FaturasMobile.styles";
import { numeroFatura } from "../format";
import { useFaturaMutations } from "../useFaturaMutations";

export interface CancelarFaturaDialogProps {
  fatura: Fatura;
  onClose: () => void;
  onCancelada: () => void;
}

// Confirmação de cancelamento. Usa a janela direto, e não o ConfirmDialog, para mostrar o erro do back e travar a confirmação.
export function CancelarFaturaDialog({ fatura, onClose, onCancelada }: CancelarFaturaDialogProps) {
  const { cancelar } = useFaturaMutations();

  // Regra de negócio recusada (400), como "a fatura já foi paga": repetir não muda a resposta.
  const recusado = cancelar.isError && cancelar.error instanceof ApiError && cancelar.error.kind === "validation";

  const efeito =
    fatura.quantidadeSaidas === 1
      ? `A saída volta a ficar em aberto e entra na próxima fatura de ${fatura.conveniada}.`
      : `As ${fatura.quantidadeSaidas} saídas voltam a ficar em aberto e entram na próxima fatura de ${fatura.conveniada}.`;

  function confirmar() {
    cancelar.mutate(fatura.convenioFaturaId, { onSuccess: () => onCancelada() });
  }

  return (
    <Modal
      open
      title={`Cancelar fatura ${numeroFatura(fatura)}?`}
      onClose={cancelar.isPending ? () => undefined : onClose}
      closeOnBackdrop={false}
      fullScreenOnMobile={false}
      footer={
        <>
          <BotaoRodape type="button" variant="secondary" onClick={onClose} disabled={cancelar.isPending} autoFocus>
            Manter fatura
          </BotaoRodape>
          <BotaoPerigoEmbaixo type="button" variant="danger" onClick={confirmar} disabled={cancelar.isPending || recusado}>
            {cancelar.isPending ? "Cancelando…" : "Cancelar fatura"}
          </BotaoPerigoEmbaixo>
        </>
      }
    >
      {cancelar.isError && <ErrorBanner role="alert">{cancelar.error.message}</ErrorBanner>}
      <Text variant="muted">
        {efeito} A fatura continua na lista como cancelada. Esta ação não pode ser desfeita.
      </Text>
    </Modal>
  );
}
