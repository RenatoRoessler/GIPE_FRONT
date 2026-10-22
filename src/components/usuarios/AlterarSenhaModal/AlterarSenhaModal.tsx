"use client";

import { useMutation } from "@tanstack/react-query";
import { useId, useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { PasswordRequirements, type PasswordRequirementsRule } from "@/components/ui/PasswordRequirements";
import { ApiError } from "@/lib/api/errors";
import { alterarSenha } from "@/lib/api/services/usuario";
import { alterarSenhaSchema, SENHA_NOVA_MIN } from "@/lib/schemas/alterarSenha";
import { Form, Note } from "../Usuarios.styles";

export interface AlterarSenhaModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const SENHA_ATUAL_INCORRETA = "Senha atual incorreta.";

// [A CONFIRMAR] O contrato não diz como o back responde à senha atual incorreta. 401 vira erro do campo; 400/422 só
// vai para o campo quando a mensagem do back fala da senha atual, senão fica no banner.
function erroDaSenhaAtual(error: Error): string | null {
  if (!(error instanceof ApiError)) {
    return null;
  }
  if (error.kind === "unauthorized") {
    return SENHA_ATUAL_INCORRETA;
  }
  if (error.kind === "validation" && /atual/i.test(error.message)) {
    return error.message;
  }
  return null;
}

export function AlterarSenhaModal({ onClose, onSuccess }: AlterarSenhaModalProps) {
  const formId = useId();

  const mutation = useMutation({
    mutationFn: (values: { senhaAtual: string; novaSenha: string }) => alterarSenha(values),
    // O token atual continua válido (contrato): nada de logout aqui.
    onSuccess: () => {
      onSuccess("Senha alterada.");
      onClose();
    },
    onError: (error) => {
      const mensagem = erroDaSenhaAtual(error);
      if (mensagem) {
        form.setFieldMeta("senhaAtual", (meta) => ({
          ...meta,
          isTouched: true,
          errorMap: { ...meta.errorMap, onServer: mensagem },
        }));
      }
    },
  });

  const form = useAppForm({
    defaultValues: { senhaAtual: "", novaSenha: "", confirmacao: "" },
    validators: {
      onChange: ({ value }) => {
        const result = alterarSenhaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate({ senhaAtual: value.senhaAtual, novaSenha: value.novaSenha }),
  });

  const values = useStore(form.store, (state) => state.values);
  const valido = alterarSenhaSchema.safeParse(values).success;
  const enviando = mutation.isPending;
  const erroNoCampo = mutation.isError && erroDaSenhaAtual(mutation.error) !== null;

  const rules = useMemo<PasswordRequirementsRule[]>(
    () => [
      { id: "tamanho", label: `Pelo menos ${SENHA_NOVA_MIN} caracteres`, test: (senha) => senha.length >= SENHA_NOVA_MIN },
      {
        id: "diferente",
        label: "Diferente da senha atual",
        test: (senha) => senha !== "" && senha !== values.senhaAtual,
      },
    ],
    [values.senhaAtual],
  );

  function limparErroDoServidor() {
    form.setFieldMeta("senhaAtual", (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }));
    mutation.reset();
  }

  function handleClose() {
    if (!enviando) {
      onClose();
    }
  }

  return (
    <Modal
      open
      title="Alterar senha"
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={enviando || !valido || erroNoCampo}>
            {enviando ? "Alterando…" : "Alterar senha"}
          </Button>
        </>
      }
    >
      {mutation.isError && !erroNoCampo && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="senhaAtual" listeners={{ onChange: limparErroDoServidor }}>
          {(field) => (
            <field.TextField
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              autoFocus
              disabled={enviando}
            />
          )}
        </form.AppField>
        <form.AppField name="novaSenha">
          {(field) => (
            <field.TextField label="Nova senha" type="password" autoComplete="new-password" disabled={enviando} />
          )}
        </form.AppField>
        <PasswordRequirements value={values.novaSenha} rules={rules} />
        <form.AppField name="confirmacao">
          {(field) => (
            <field.TextField
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              disabled={enviando}
            />
          )}
        </form.AppField>
        <Note>
          Sua senha vale para todas as empresas em que você tem acesso. Você continuará logado neste dispositivo.
        </Note>
      </Form>
    </Modal>
  );
}
