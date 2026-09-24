"use client";

import { withForm } from "@/components/form";
import { Input } from "@/components/ui/Input";
import { formatCPF } from "@/lib/cpf";
import { EMPTY_ADMIN_USER_DATA } from "@/types/adesao";
import { Grid } from "../shared/FormGrid.styles";

export const AdminUserStepFields = withForm({
  defaultValues: EMPTY_ADMIN_USER_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    return (
      <Grid>
        <form.AppField name="nome">
          {(field) => <field.TextField label="Nome" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="sobrenome">
          {(field) => <field.TextField label="Sobrenome" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="email">
          {(field) => (
            <field.TextField label="E-mail" type="email" disabled={disabled} required />
          )}
        </form.AppField>
        <form.Field name="cpf">
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
        <form.AppField name="senha">
          {(field) => (
            <field.TextField
              label="Senha"
              type="password"
              autoComplete="new-password"
              disabled={disabled}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="repetirSenha">
          {(field) => (
            <field.TextField
              label="Repetir senha"
              type="password"
              autoComplete="new-password"
              disabled={disabled}
              required
            />
          )}
        </form.AppField>
      </Grid>
    );
  },
});
