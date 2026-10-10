"use client";

import { withForm } from "@/components/form";
import { Input } from "@/components/ui/Input";
import { formatCPF } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { EMPTY_ADMIN_USER_DATA } from "@/types/adesao";
import { Grid, GridItem } from "@/components/form/FormGrid.styles";

export const AdminUserStepFields = withForm({
  defaultValues: EMPTY_ADMIN_USER_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    return (
      <Grid>
        <GridItem $span>
          <form.AppField name="nome">
            {(field) => (
              <field.TextField
                label="Nome completo"
                autoComplete="name"
                disabled={disabled}
                required
              />
            )}
          </form.AppField>
        </GridItem>
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
        <form.Field name="celular">
          {(field) => (
            <Input
              label="Celular"
              type="tel"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
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
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="E-mail" type="email" disabled={disabled} required />
            )}
          </form.AppField>
        </GridItem>
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
