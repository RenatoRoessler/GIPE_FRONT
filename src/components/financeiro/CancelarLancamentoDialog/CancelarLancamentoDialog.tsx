"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";
import { ApiError } from "@/lib/api/errors";
import { formatBRL } from "@/lib/money";
import { TIPO_LANCAMENTO, type Lancamento } from "@/types/financeiro";
import { tipoDoLancamento, tipoPorCategoria } from "../categorias";
import { formatValorComSinal } from "../format";
import { useCategorias } from "../useCategorias";
import { useLancamentoMutations } from "../useLancamentoMutations";

export interface CancelarLancamentoDialogProps {
  lancamento: Lancamento;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

// Confirmação de cancelamento. Usa a janela direto, e não o ConfirmDialog, para mostrar o erro do back e travar a confirmação.
export function CancelarLancamentoDialog({ lancamento, onClose, onSuccess }: CancelarLancamentoDialogProps) {
  const categorias = useCategorias();
  const tipos = useMemo(() => tipoPorCategoria(categorias.data ?? []), [categorias.data]);
  const { cancelar } = useLancamentoMutations();
  const tipo = tipoDoLancamento(lancamento, tipos);
  const valor = formatBRL(lancamento.valor);

  // Regra de negócio recusada (400), como "o caixa deste lançamento já foi fechado": repetir não muda a resposta.
  const recusado = cancelar.isError && cancelar.error instanceof ApiError && cancelar.error.kind === "validation";

  function confirmar() {
    cancelar.mutate(lancamento, {
      onSuccess: () => {
        onSuccess("Lançamento cancelado.");
        onClose();
      },
    });
  }

  return (
    <Modal
      open
      title="Cancelar lançamento?"
      onClose={cancelar.isPending ? () => undefined : onClose}
      closeOnBackdrop={false}
      fullScreenOnMobile={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={cancelar.isPending} autoFocus>
            Voltar
          </Button>
          <Button type="button" variant="danger" onClick={confirmar} disabled={cancelar.isPending || recusado}>
            {cancelar.isPending ? "Cancelando…" : "Cancelar lançamento"}
          </Button>
        </>
      }
    >
      {cancelar.isError && <ErrorBanner role="alert">{cancelar.error.message}</ErrorBanner>}
      <Text variant="muted">
        {lancamento.descricao || "Lançamento"} · {formatValorComSinal(lancamento.valor, tipo)}. O lançamento fica no histórico como cancelado e sai do fluxo de caixa.
        {lancamento.peloCaixa &&
          (tipo === TIPO_LANCAMENTO.Entrada ? ` ${valor} saem da gaveta do caixa.` : ` ${valor} voltam para a gaveta do caixa.`)}
      </Text>
    </Modal>
  );
}
