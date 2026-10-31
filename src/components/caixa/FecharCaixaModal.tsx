"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { fecharCaixa } from "@/lib/api/services/caixa";
import { parseMoney } from "@/lib/money";
import { toConferencias } from "@/lib/schemas/caixa";
import type { Turno } from "@/types/caixa";
import type { CaixaModalProps } from "./AbrirCaixaModal";
import { FieldStack } from "./Caixa.styles";
import { ConferenciaFields } from "./ConferenciaFields";
import { ResumoFechamento } from "./ResumoFechamento";
import { useConferencia } from "./useConferencia";
import { CAIXA_KEY } from "./useCaixa";
import { TECLADO_ALFA, TECLADO_DECIMAL } from "@/lib/teclado/tipos";

// Duas fases: conferência e, depois de fechar, o resumo do turno encerrado.
export function FecharCaixaModal({ turno, onClose, onSuccess }: CaixaModalProps & { turno: Turno }) {
  const formId = useId();
  const queryClient = useQueryClient();
  const { values, errors, setConferencia, setField, validate } = useConferencia(turno.formasPagamento);

  const mutation = useMutation({
    mutationFn: fecharCaixa,
  });

  const resumo = mutation.data;

  // Só atualiza a tela (que passa a "Caixa fechado") quando o resumo é dispensado.
  async function handleConcluir() {
    await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
    onSuccess("Caixa fechado.");
    onClose();
  }

  function handleSubmit() {
    const valid = validate();
    if (!valid) {
      return;
    }
    mutation.mutate({
      conferencias: toConferencias(turno.formasPagamento, valid.conferencias),
      valorFundoCaixa: valid.fundoCaixa === "" ? null : parseMoney(valid.fundoCaixa),
      observacao: valid.observacao || undefined,
    });
  }

  if (resumo) {
    return <ResumoFechamento tipo="fechamento" turno={resumo} onConcluir={() => void handleConcluir()} />;
  }

  return (
    <Modal
      open
      title="Fechar caixa"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="danger" disabled={mutation.isPending}>
            {mutation.isPending ? "Fechando..." : "Fechar caixa"}
          </Button>
        </>
      }
    >
      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <FieldStack>
          <ConferenciaFields
            formas={turno.formasPagamento}
            values={values.conferencias}
            errors={errors.conferencias}
            onChange={setConferencia}
            disabled={mutation.isPending}
          />
          <Input
            label="Fundo de caixa contado na gaveta (opcional)"
            inputMode="decimal"
            teclado={TECLADO_DECIMAL}
            placeholder="0,00"
            hint="Informe o que há na gaveta no fechamento, além do dinheiro conferido."
            value={values.fundoCaixa}
            onChange={(event) => setField("fundoCaixa", event.target.value)}
            error={errors.fundoCaixa}
            disabled={mutation.isPending}
          />
          <Input
            label="Observação (opcional)"
            maxLength={200}
            teclado={TECLADO_ALFA}
            value={values.observacao}
            onChange={(event) => setField("observacao", event.target.value)}
            disabled={mutation.isPending}
          />
        </FieldStack>
      </form>
    </Modal>
  );
}
