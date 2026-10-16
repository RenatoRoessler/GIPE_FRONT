"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useMemo, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { createMensalista, updateMensalista } from "@/lib/api/services/mensalista";
import { fromMensalista } from "@/lib/api/services/mensalista.mapper";
import { formatDocumento } from "@/lib/documento";
import { formatPhone } from "@/lib/phone";
import { mensalistaSchema } from "@/lib/schemas/mensalista";
import {
  TIPO_PESSOA,
  type Mensalista,
  type MensalistaFormValues,
  type MensalistaTipo,
  type TipoPessoa,
} from "@/types/mensalista";
import { formatCategoria, formatValor } from "../format";
import { MENSALISTAS_QUERY_KEY, useTiposMensalidade } from "../useTiposMensalidade";
import { FieldRow, Form, Note } from "./MensalistaModal.styles";

export interface MensalistaModalProps {
  // Presente => edição.
  mensalista?: Mensalista;
  onClose: () => void;
  onSuccess: (message: string) => void;
  // Sem tipo ativo não há como cadastrar: leva o usuário à aba de tipos.
  onGoToTipos?: () => void;
}

const EMPTY_VALUES: MensalistaFormValues = {
  mensalistaTipoId: "",
  tipoPessoa: String(TIPO_PESSOA.Fisica),
  documento: "",
  nome: "",
  email: "",
  celular: "",
  diaVencimento: "",
  ativo: true,
};

const PESSOA_OPTIONS = [
  { value: String(TIPO_PESSOA.Fisica), label: "Pessoa física" },
  { value: String(TIPO_PESSOA.Juridica), label: "Pessoa jurídica" },
];

function tipoLabel(tipo: MensalistaTipo): string {
  const base = `${tipo.tipoMensal} · ${formatCategoria(tipo.categoria)} · ${formatValor(tipo.valorMensalidade)}`;
  return tipo.ativo ? base : `${base} (inativo)`;
}

export function MensalistaModal({ mensalista, onClose, onSuccess, onGoToTipos }: MensalistaModalProps) {
  const formId = useId();
  const queryClient = useQueryClient();
  const isEdit = Boolean(mensalista);
  const initialValues = useMemo(() => (mensalista ? fromMensalista(mensalista) : EMPTY_VALUES), [mensalista]);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const { data: tipos } = useTiposMensalidade();

  // Cadastro: só tipos ativos. Edição: também o tipo atual, mesmo que tenha sido desativado.
  const tipoOptions = useMemo(
    () =>
      (tipos ?? []).filter(
        (tipo) => tipo.ativo || (mensalista !== undefined && tipo.mensalistaTipoId === mensalista.mensalistaTipoId),
      ),
    [tipos, mensalista],
  );
  const semTipoAtivo = !isEdit && tipos !== undefined && !tipos.some((tipo) => tipo.ativo);

  const mutation = useMutation({
    mutationFn: async (values: MensalistaFormValues) => {
      if (mensalista) {
        await updateMensalista(mensalista.mensalistaId, values);
      } else {
        await createMensalista({ ...values, ativo: true });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY });
      onSuccess(isEdit ? "Mensalista atualizado." : "Mensalista cadastrado.");
      onClose();
    },
  });

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        const result = mensalistaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const values = useStore(form.store, (state) => state.values);
  const pessoa = Number(values.tipoPessoa) as TipoPessoa;
  const isJuridica = pessoa === TIPO_PESSOA.Juridica;
  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
  const isSending = mutation.isPending;

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
      title={isEdit ? "Editar mensalista" : "Novo mensalista"}
      onClose={handleClose}
      closeOnBackdrop={false}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending || semTipoAtivo}>
            {isSending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      {semTipoAtivo && (
        <Note role="status">
          <span>Crie um tipo de mensalidade antes de cadastrar mensalistas.</span>
          {onGoToTipos && (
            <Button type="button" variant="secondary" onClick={onGoToTipos}>
              Criar tipo
            </Button>
          )}
        </Note>
      )}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="mensalistaTipoId" listeners={{ onChange: () => mutation.reset() }}>
          {(field) => (
            <field.SelectField label="Tipo de mensalidade" disabled={isSending || semTipoAtivo}>
              <option value="">Selecione</option>
              {tipoOptions.map((tipo) => (
                <option key={tipo.mensalistaTipoId} value={tipo.mensalistaTipoId}>
                  {tipoLabel(tipo)}
                </option>
              ))}
            </field.SelectField>
          )}
        </form.AppField>

        <form.AppField
          name="tipoPessoa"
          listeners={{
            // Trocar a pessoa muda a máscara: o documento digitado deixa de valer.
            onChange: () => form.setFieldValue("documento", ""),
          }}
        >
          {(field) => (
            <OptionGroup
              legend="Tipo de pessoa"
              options={PESSOA_OPTIONS}
              value={field.state.value}
              onChange={(value) => field.handleChange(value)}
              disabled={isSending || isEdit}
            />
          )}
        </form.AppField>

        <FieldRow>
          <form.AppField name="documento">
            {(field) => (
              <field.TextField
                label={isJuridica ? "CNPJ" : "CPF"}
                format={(value) => formatDocumento(value, pessoa)}
                autoComplete="off"
                inputMode={isJuridica ? "text" : "numeric"}
                disabled={isSending || isEdit}
              />
            )}
          </form.AppField>
          <form.AppField name="nome">
            {(field) => (
              <field.TextField
                label={isJuridica ? "Razão social" : "Nome"}
                autoComplete="off"
                maxLength={150}
                disabled={isSending}
              />
            )}
          </form.AppField>
        </FieldRow>

        <FieldRow>
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="E-mail" type="email" autoComplete="off" maxLength={150} disabled={isSending} />
            )}
          </form.AppField>
          <form.AppField name="celular">
            {(field) => (
              <field.TextField
                label="Celular"
                format={formatPhone}
                inputMode="tel"
                autoComplete="off"
                placeholder="(00) 90000-0000"
                disabled={isSending}
              />
            )}
          </form.AppField>
        </FieldRow>

        <form.AppField name="diaVencimento">
          {(field) => (
            <field.TextField
              label="Dia de vencimento"
              format={(value) => value.replace(/\D/g, "").slice(0, 2)}
              inputMode="numeric"
              autoComplete="off"
              hint="Dia do mês em que a mensalidade vence (1 a 31)."
              disabled={isSending}
            />
          )}
        </form.AppField>

        {isEdit && (
          <form.AppField name="ativo">
            {(field) => (
              <field.SwitchField label={`Mensalista ${values.ativo ? "ativo" : "inativo"}`} disabled={isSending} />
            )}
          </form.AppField>
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
