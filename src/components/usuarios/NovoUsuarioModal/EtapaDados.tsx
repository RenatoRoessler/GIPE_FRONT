"use client";

import { useAppForm, zodFieldErrors } from "@/components/form";
import { formatCPF } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { novoUsuarioSchema, perfilSchema, USUARIO_EMAIL_MAX, USUARIO_NOME_MAX } from "@/lib/schemas/usuario";
import type { CpfConsulta, NovoUsuarioValues } from "@/types/usuario";
import { PERFIL_OPTIONS } from "../perfil";
import { Form, Note, ReadOnlyBlock } from "../Usuarios.styles";

export interface EtapaDadosProps {
  formId: string;
  cpf: string;
  // Presente = pessoa já cadastrada na Murel: dados em leitura, só o perfil é escolhido.
  pessoa?: CpfConsulta;
  disabled: boolean;
  onSubmit: (values: NovoUsuarioValues) => void;
}

export function EtapaDados({ formId, cpf, pessoa, disabled, onSubmit }: EtapaDadosProps) {
  const form = useAppForm({
    defaultValues: {
      cpf,
      nome: pessoa?.nome ?? "",
      email: pessoa?.email ?? "",
      celular: pessoa?.celular ?? "",
      perfil: "",
    } satisfies NovoUsuarioValues,
    validators: {
      onChange: ({ value }) => {
        const result = (pessoa ? perfilSchema : novoUsuarioSchema).safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <Form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Note>CPF {formatCPF(cpf)}</Note>
      {pessoa ? (
        <>
          <ReadOnlyBlock aria-label="Dados da pessoa, apenas para conferência">
            <dt>Nome</dt>
            <dd>{pessoa.nome}</dd>
            <dt>E-mail</dt>
            <dd>{pessoa.email}</dd>
            <dt>Celular</dt>
            <dd>{formatPhone(pessoa.celular)}</dd>
          </ReadOnlyBlock>
          <Note>Estes dados pertencem à própria pessoa e não são alterados por aqui.</Note>
        </>
      ) : (
        <>
          <form.AppField name="nome">
            {(field) => (
              <field.TextField label="Nome" autoComplete="off" maxLength={USUARIO_NOME_MAX} disabled={disabled} />
            )}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="E-mail"
                type="email"
                autoComplete="off"
                maxLength={USUARIO_EMAIL_MAX}
                disabled={disabled}
              />
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
                disabled={disabled}
              />
            )}
          </form.AppField>
        </>
      )}
      <form.AppField name="perfil">
        {(field) => (
          <field.SelectField label="Perfil" disabled={disabled}>
            <option value="">Selecione</option>
            {PERFIL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </field.SelectField>
        )}
      </form.AppField>
      <Note>
        {pessoa
          ? "A pessoa mantém a senha atual e receberá um e-mail avisando do novo acesso."
          : "Uma senha temporária será enviada para o e-mail informado. No primeiro acesso, a pessoa será obrigada a trocá-la."}
      </Note>
    </Form>
  );
}
