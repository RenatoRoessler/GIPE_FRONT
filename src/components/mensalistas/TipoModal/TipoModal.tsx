"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/errors";
import { createTipoMensalidade, updateTipoMensalidade } from "@/lib/api/services/mensalista";
import { fromTipo } from "@/lib/api/services/mensalista.mapper";
import { tipoSchema } from "@/lib/schemas/mensalista";
import type { MensalistaTipo, TipoFormValues } from "@/types/mensalista";
import { TIPO_CATEGORIA, TIPO_CATEGORIA_OPTIONS } from "@/types/preco";
import { MENSALISTAS_QUERY_KEY, TIPOS_QUERY_KEY } from "../useTiposMensalidade";
import { FieldRow, Form } from "./TipoModal.styles";

export interface TipoModalProps {
  // Presente => edição.
  tipo?: MensalistaTipo;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const EMPTY_VALUES: TipoFormValues = {
  tipoMensal: "",
  categoria: "",
  valorMensalidade: "",
  horarioEntrada: "",
  horarioSaida: "",
  ativo: true,
};

const NOME_MAX = 100;
const NOME_COUNTER_FROM = 80;

// [A CONFIRMAR] O back responde 400 genérico para "nome + categoria já existem"; sem código de erro
// estruturado, a heurística é a mensagem citar a duplicidade. Trocar por checagem de código quando existir.
function isDuplicidade(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "validation" && /j[aá] exist|duplic|mesmo nome|mesma categoria/i.test(error.message);
}

export function TipoModal({ tipo, onClose, onSuccess }: TipoModalProps) {
  const formId = useId();
  const queryClient = useQueryClient();
  const isEdit = Boolean(tipo);
  const initialValues = tipo ? fromTipo(tipo) : EMPTY_VALUES;
  const [confirmingClose, setConfirmingClose] = useState(false);

  const mutation = useMutation({
    mutationFn: async (values: TipoFormValues) => {
      if (tipo) {
        await updateTipoMensalidade(tipo.mensalistaTipoId, values);
      } else {
        await createTipoMensalidade(values);
      }
    },
    onSuccess: async () => {
      // A lista de mensalistas mostra nome, categoria e valor do tipo: também precisa recarregar.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TIPOS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY }),
      ]);
      onSuccess(isEdit ? "Tipo atualizado." : "Tipo criado.");
      onClose();
    },
  });

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        const result = tipoSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const values = useStore(form.store, (state) => state.values);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
  const nomeLength = values.tipoMensal.length;
  const ativo = values.ativo;

  const isSending = mutation.isPending;
  const duplicidade = mutation.isError && isDuplicidade(mutation.error);

  function handleClose() {
    if (isSending) {
      return;
    }
    // Com alterações em andamento, pede confirmação antes de descartar.
    if (hasChanges) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  return (
    <Modal
      open
      title={isEdit ? "Editar tipo de mensalidade" : "Novo tipo de mensalidade"}
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending}>
            {isSending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {mutation.isError && !duplicidade && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="tipoMensal" listeners={{ onChange: () => mutation.reset() }}>
          {(field) => (
            <field.TextField
              label="Nome do tipo"
              autoFocus
              autoComplete="off"
              maxLength={NOME_MAX}
              placeholder="Ex.: Diurno, Noturno, Integral"
              hint={
                duplicidade
                  ? "Já existe um tipo ativo com esse nome e categoria."
                  : nomeLength >= NOME_COUNTER_FROM
                    ? `${nomeLength}/${NOME_MAX} caracteres`
                    : undefined
              }
              hintTone={duplicidade ? "danger" : "muted"}
              disabled={isSending}
            />
          )}
        </form.AppField>
        <FieldRow>
          <form.AppField name="categoria" listeners={{ onChange: () => mutation.reset() }}>
            {(field) => (
              <field.SelectField label="Categoria" disabled={isSending}>
                <option value="">Selecione</option>
                {TIPO_CATEGORIA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === TIPO_CATEGORIA.Todas ? "Todas as categorias" : option.label}
                  </option>
                ))}
              </field.SelectField>
            )}
          </form.AppField>
          <form.AppField name="valorMensalidade">
            {(field) => (
              <field.TextField
                label="Valor da mensalidade (R$)"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                disabled={isSending}
              />
            )}
          </form.AppField>
        </FieldRow>
        <FieldRow>
          <form.AppField name="horarioEntrada">
            {(field) => <field.TextField label="Horário de entrada" type="time" disabled={isSending} />}
          </form.AppField>
          <form.AppField name="horarioSaida">
            {(field) => (
              <field.TextField
                label="Horário de saída"
                type="time"
                hint="Opcional. Saída menor que a entrada vale para turnos que viram a noite (ex.: 19:00 às 07:00)."
                disabled={isSending}
              />
            )}
          </form.AppField>
        </FieldRow>
        {isEdit && (
          <form.AppField name="ativo">
            {(field) => (
              <field.SwitchField label={`Tipo ${ativo ? "ativo" : "inativo"}`} disabled={isSending} />
            )}
          </form.AppField>
        )}
        {isEdit && !ativo && (
          <p role="note">Deixa de ser oferecido em novos cadastros. Mensalistas atuais mantêm o tipo.</p>
        )}
      </Form>
      {confirmingClose && (
        <ConfirmDialog
          title="Descartar alterações?"
          message="Os dados preenchidos serão perdidos e nada será salvo."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
