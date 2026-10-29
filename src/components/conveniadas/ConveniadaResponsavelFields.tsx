"use client";

import { withForm } from "@/components/form";
import { Grid, GridItem } from "@/components/form/FormGrid.styles";
import { Input } from "@/components/ui/Input";
import { formatCPF } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { USUARIO_EMAIL_MAX, USUARIO_NOME_MAX } from "@/lib/schemas/usuario";
import { EMPTY_CONVENIADA_FORM } from "@/types/conveniada";
import { Aviso } from "./Conveniadas.styles";

// Seção "Responsável" do cadastro de conveniada: o dono da conveniada, que recebe o acesso.
export const ConveniadaResponsavelFields = withForm({
  defaultValues: EMPTY_CONVENIADA_FORM,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    return (
      <Grid>
        <form.AppField name="usuarioNome">
          {(field) => <field.TextField label="Nome" maxLength={USUARIO_NOME_MAX} disabled={disabled} required />}
        </form.AppField>
        <form.Field name="usuarioCpf">
          {(field) => (
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              inputMode="numeric"
              value={field.state.value}
              onChange={(event) => field.handleChange(formatCPF(event.target.value))}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              disabled={disabled}
              required
            />
          )}
        </form.Field>
        <form.AppField name="usuarioEmail">
          {(field) => (
            <field.TextField
              label="E-mail"
              type="email"
              autoComplete="off"
              maxLength={USUARIO_EMAIL_MAX}
              disabled={disabled}
              required
            />
          )}
        </form.AppField>
        <form.Field name="usuarioCelular">
          {(field) => (
            <Input
              label="Celular"
              type="tel"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              value={field.state.value}
              onChange={(event) => field.handleChange(formatPhone(event.target.value))}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              disabled={disabled}
              required
            />
          )}
        </form.Field>
        <GridItem $span>
          <Aviso>Se o CPF já tem cadastro, ele ganha acesso a esta conveniada e não recebe e-mail.</Aviso>
        </GridItem>
      </Grid>
    );
  },
});
