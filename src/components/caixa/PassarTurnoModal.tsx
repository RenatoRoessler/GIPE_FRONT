"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { passarTurno } from "@/lib/api/services/caixa";
import { parseMoney } from "@/lib/money";
import { toConferencias } from "@/lib/schemas/caixa";
import type { Turno } from "@/types/caixa";
import type { CaixaModalProps } from "./AbrirCaixaModal";
import { FieldStack } from "./Caixa.styles";
import { ConferenciaFields } from "./ConferenciaFields";
import { useConferencia } from "./useConferencia";
import { CAIXA_KEY } from "./useCaixa";

export function PassarTurnoModal({ turno, onClose, onSuccess }: CaixaModalProps & { turno: Turno }) {
  const formId = useId();
  const queryClient = useQueryClient();
  const { values, errors, setConferencia, setField, validate } = useConferencia(turno.formasPagamento);

  const mutation = useMutation({
    mutationFn: passarTurno,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
      onSuccess("Turno passado.");
      onClose();
    },
  });

  function handleSubmit() {
    const valid = validate();
    if (!valid) {
      return;
    }
    mutation.mutate({
      conferencias: toConferencias(turno.formasPagamento, valid.conferencias),
      valorInicial: valid.valorInicial === "" ? null : parseMoney(valid.valorInicial),
      observacao: valid.observacao || undefined,
    });
  }

  return (
    <Modal
      open
      title="Passar turno"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending}>
            {mutation.isPending ? "Passando..." : "Assumir turno"}
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
            label="Valor inicial do novo turno (opcional)"
            inputMode="decimal"
            placeholder="0,00"
            hint="Dinheiro que fica na gaveta. Se vazio, assume o dinheiro conferido."
            value={values.valorInicial}
            onChange={(event) => setField("valorInicial", event.target.value)}
            error={errors.valorInicial}
            disabled={mutation.isPending}
          />
          <Input
            label="Observação (opcional)"
            maxLength={200}
            value={values.observacao}
            onChange={(event) => setField("observacao", event.target.value)}
            disabled={mutation.isPending}
          />
        </FieldStack>
      </form>
    </Modal>
  );
}
