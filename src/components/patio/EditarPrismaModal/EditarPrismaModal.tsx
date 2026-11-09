"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useMemo } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/errors";
import { atualizarPrisma } from "@/lib/api/services/patio";
import { prismaDoTexto } from "@/lib/prisma";
import { criarPrismaEdicaoSchema } from "@/lib/schemas/prisma";
import type { PatioVeiculo } from "@/types/patio";
import { PATIO_QUERY_KEY } from "../patioKeys";
import { Campo } from "./EditarPrismaModal.styles";

export interface EditarPrismaModalProps {
  veiculo: PatioVeiculo;
  onClose: () => void;
  // O prisma foi gravado; quem abriu o modal decide o aviso. O modal fecha em seguida.
  onSalvo: () => void;
}

// Corrige ou informa o prisma de um veículo que está no pátio; só mensalista pode apagá-lo (campo vazio).
export function EditarPrismaModal({ veiculo, onClose, onSalvo }: EditarPrismaModalProps) {
  const formId = useId();
  const queryClient = useQueryClient();

  const schema = useMemo(() => criarPrismaEdicaoSchema({ mensalista: veiculo.mensalista }), [veiculo.mensalista]);

  const mutation = useMutation({
    mutationFn: (prisma: number | null) => atualizarPrisma(veiculo.patioId, prisma),
    onSuccess: async () => {
      // O ticket lê o veículo da lista do pátio: ela precisa trazer o valor novo.
      await queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY });
      onSalvo();
      onClose();
    },
  });

  const form = useAppForm({
    defaultValues: { prisma: veiculo.prisma === null ? "" : String(veiculo.prisma) },
    validators: {
      onChange: ({ value }) => {
        const result = schema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(prismaDoTexto(value.prisma)),
  });

  const texto = useStore(form.store, ({ values }) => values.prisma);
  const valido = schema.safeParse({ prisma: texto }).success;
  const igualAoAtual = prismaDoTexto(texto) === veiculo.prisma;
  const enviando = mutation.isPending;
  const saiuDoPatio = mutation.error instanceof ApiError && mutation.error.kind === "not_found";

  return (
    <Modal
      open
      title={`Prisma · ${veiculo.placa}`}
      size="sm"
      onClose={enviando ? () => undefined : onClose}
      // O valor digitado é um dado em andamento: tocar fora não fecha.
      closeOnBackdrop={false}
      footer={
        saiuDoPatio ? (
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={enviando || !valido || igualAoAtual}>
              {enviando ? "Salvando…" : "Salvar"}
            </Button>
          </>
        )
      }
    >
      {mutation.isError && (
        <ErrorBanner role="alert">{saiuDoPatio ? "Este carro não está mais no pátio." : mutation.error.message}</ErrorBanner>
      )}
      {!saiuDoPatio && (
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            // O botão já fica desabilitado; isto cobre o Enter no campo.
            if (valido && !igualAoAtual && !enviando) {
              void form.handleSubmit();
            }
          }}
        >
          <Campo>
            <form.AppField name="prisma">{(field) => <field.PrismaField disabled={enviando} data-autofocus="" />}</form.AppField>
          </Campo>
        </form>
      )}
    </Modal>
  );
}
