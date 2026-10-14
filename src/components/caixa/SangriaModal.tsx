"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { registrarSangria } from "@/lib/api/services/caixa";
import { formatBRL, parseMoney } from "@/lib/money";
import { createSangriaSchema } from "@/lib/schemas/caixa";
import type { Turno } from "@/types/caixa";
import { FieldStack, Hint } from "./Caixa.styles";
import type { CaixaModalProps } from "./AbrirCaixaModal";
import { CAIXA_KEY } from "./useCaixa";

export function SangriaModal({ turno, onClose, onSuccess }: CaixaModalProps & { turno: Turno }) {
  const formId = useId();
  const queryClient = useQueryClient();
  const disponivel = turno.disponivelSangria;

  const mutation = useMutation({
    mutationFn: registrarSangria,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
      onSuccess("Retirada registrada.");
      onClose();
    },
  });

  const form = useAppForm({
    defaultValues: { valor: "", observacao: "" },
    validators: {
      onChange: ({ value }) => {
        const result = createSangriaSchema(disponivel).safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) =>
      mutation.mutate({ valor: parseMoney(value.valor), observacao: value.observacao.trim() }),
  });

  return (
    <Modal
      open
      title="Retirada de valor"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending}>
            {mutation.isPending ? "Registrando..." : "Registrar retirada"}
          </Button>
        </>
      }
    >
      <Hint>
        Disponível para retirada: <strong>{formatBRL(disponivel ?? 0)}</strong> (dinheiro esperado no turno menos
        o troco padrão, que sempre fica na gaveta).
      </Hint>
      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldStack>
          <form.AppField name="valor">
            {(field) => (
              <field.TextField
                label="Valor"
                inputMode="decimal"
                placeholder="0,00"
                autoFocus
                disabled={mutation.isPending}
              />
            )}
          </form.AppField>
          <form.AppField name="observacao">
            {(field) => (
              <field.TextField label="Motivo" maxLength={200} disabled={mutation.isPending} />
            )}
          </form.AppField>
        </FieldStack>
      </form>
    </Modal>
  );
}
