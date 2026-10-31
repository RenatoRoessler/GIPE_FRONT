"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { abrirCaixa } from "@/lib/api/services/caixa";
import { parseMoney } from "@/lib/money";
import { fundoCaixaSchema } from "@/lib/schemas/caixa";
import { Hint } from "./Caixa.styles";
import { CAIXA_KEY } from "./useCaixa";
import { TECLADO_DECIMAL } from "@/lib/teclado/tipos";

export interface CaixaModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AbrirCaixaModal({ onClose, onSuccess }: CaixaModalProps) {
  const formId = useId();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (fundoCaixa: number) => abrirCaixa(fundoCaixa),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
      onSuccess("Caixa aberto.");
      onClose();
    },
  });

  const form = useAppForm({
    defaultValues: { fundoCaixa: "" },
    validators: {
      onChange: ({ value }) => {
        const result = fundoCaixaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(parseMoney(value.fundoCaixa)),
  });

  return (
    <Modal
      open
      title="Abrir caixa"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending}>
            {mutation.isPending ? "Abrindo..." : "Abrir caixa"}
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
          void form.handleSubmit();
        }}
      >
        <form.AppField name="fundoCaixa">
          {(field) => (
            <field.TextField
              label="Fundo de caixa"
              inputMode="decimal"
              teclado={TECLADO_DECIMAL}
              placeholder="0,00"
              autoFocus
              disabled={mutation.isPending}
            />
          )}
        </form.AppField>
      </form>
      <Hint>O fundo vira o valor inicial do primeiro turno, em nome de quem abre o caixa.</Hint>
    </Modal>
  );
}
